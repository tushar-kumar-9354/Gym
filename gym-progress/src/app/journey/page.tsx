"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Calendar as CalendarIcon, CheckCircle2, Trash2, Plus, Search, Loader2, ArrowRight, Dumbbell, Coffee, Droplet, Scale, PieChart, Check, Moon } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import { computeAdvancedGoldilocksScores } from "@/lib/scoring";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getExerciseTrackingType, formatExerciseValue, calculateOneRM, formatLiters, formatMacroValue } from "@/utils/oneRM";
import { computePlanTargets } from "@/lib/planTargets";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function JourneyContent() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");

  const [selectedDate, setSelectedDate] = useState<string>(urlDate || new Date().toISOString().split('T')[0]);
  const [planDays, setPlanDays] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [nextWeighIn, setNextWeighIn] = useState<string | null>(null);
  const [weighInCountdown, setWeighInCountdown] = useState<string>("");
  
  // Diet States
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [customMeals, setCustomMeals] = useState<FoodItem[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [savePermanent, setSavePermanent] = useState(false);

  // Exercise States
  const [bodyPart, setBodyPart] = useState("Chest");
  const [exercise, setExercise] = useState("Bench Press");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  
  // Custom Exercise States
  const [newCustomExercise, setNewCustomExercise] = useState("");
  const [customExerciseDB, setCustomExerciseDB] = useState<{ [key: string]: string[] }>({});

  // Water States
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterHistory, setWaterHistory] = useState<{ ml: number; timestamp: string }[]>([]);
  const [customWaterInput, setCustomWaterInput] = useState("");

  // Sleep States
  const [sleepHours, setSleepHours] = useState<number | "">("");
  const [sleepQuality, setSleepQuality] = useState("Good");
  const [savedSleep, setSavedSleep] = useState<{ hours: number; quality: string } | null>(null);
  const [sleepEntries, setSleepEntries] = useState<{ hours: number; quality: string }[]>([]);
  const [lastDeletedSleep, setLastDeletedSleep] = useState<{ entry: any; index: number } | null>(null);

  const [startWeight, setStartWeight] = useState(80);
  const [goalWeight, setGoalWeight] = useState(75);
  const [planDuration, setPlanDuration] = useState(3);
  const [currentWeight, setCurrentWeight] = useState(80);
  const [sleepTarget, setSleepTargetState] = useState(8);
  const [goal, setGoal] = useState("General Fitness");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [customTargets, setCustomTargets] = useState<any>(null);

  const defaultExerciseDatabase: { [key: string]: string[] } = {
    Chest: ["Bench Press", "Incline Dumbbell Press", "Chest Flyes"],
    Back: ["Deadlift", "Pull-ups", "Bent Over Rows"],
    Legs: ["Squat", "Leg Press", "Calf Raises"],
    Shoulders: ["Overhead Press", "Lateral Raises"],
    Arms: ["Bicep Curls", "Tricep Pushdowns"],
    Abs: ["Plank", "Crunches", "Leg Raises", "Russian Twists"],
  };

  const defaultFoods: FoodItem[] = [
    { name: "Oats (100g)", calories: 389, protein: 17, carbs: 66, fat: 7 },
    { name: "Apple (1 Medium)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: "Banana (1 Medium)", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { name: "Soya Chunks (50g)", calories: 172, protein: 26, carbs: 15, fat: 0.3 },
    { name: "Whey Protein (1 Scoop)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
    { name: "Chapati (1 Piece)", calories: 104, protein: 3, carbs: 22, fat: 0.4 },
    { name: "Milk (250ml)", calories: 150, protein: 8, carbs: 12, fat: 8 },
    { name: "Almonds (10 Pieces)", calories: 70, protein: 2.5, carbs: 2.5, fat: 6 },
  ];

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
    let plansModified = false;
    const sanitizedPlans = plans.map((p: any) => {
      let itemModified = false;
      let w = p.weight;
      let gw = p.goalWeight;
      let h = p.height;

      if (typeof w !== 'number' || isNaN(w) || w <= 0) {
        w = 80;
        itemModified = true;
      }
      if (typeof gw !== 'number' || isNaN(gw) || gw <= 0) {
        gw = 75;
        itemModified = true;
      }
      if (typeof h !== 'number' || isNaN(h) || h <= 0) {
        h = 175;
        itemModified = true;
      }

      if (itemModified) {
        plansModified = true;
        return { ...p, weight: w, goalWeight: gw, height: h };
      }
      return p;
    });

    if (plansModified && email) {
      localStorage.setItem(`${email}_plans`, JSON.stringify(sanitizedPlans));
    }

    const currentPlan = sanitizedPlans.find((p: any) => p.name === plan);
    if (currentPlan) {
      const storedWeights = JSON.parse(localStorage.getItem(`${email}_${plan}_weeklyWeights`) || "[]");
      const latestWeight = storedWeights.length > 0 ? storedWeights[storedWeights.length - 1].weight : currentPlan.weight;
      setCurrentWeight(latestWeight);
      setStartWeight(currentPlan.weight);
      setGoalWeight(currentPlan.goalWeight);
      setPlanDuration(currentPlan.duration);
      setSleepTargetState(currentPlan.sleepTarget || 8);
      setGoal(currentPlan.goal || "General Fitness");
      setActivityLevel(currentPlan.activityLevel || "moderate");
      // load next weigh-in timestamp if present
      const storedNext = localStorage.getItem(`${email}_${plan}_nextWeighIn`);
      if (storedNext) setNextWeighIn(storedNext);
    }

    const savedCustom = email && plan ? localStorage.getItem(`${email}_${plan}_customTargets`) : null;
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        if (parsed && typeof parsed === "object") {
          if (parsed.protein && (typeof parsed.protein !== "number" || parsed.protein < 30 || parsed.protein > 500)) delete parsed.protein;
          if (parsed.calories && (typeof parsed.calories !== "number" || parsed.calories < 1000 || parsed.calories > 10000)) delete parsed.calories;
          if (parsed.fats && (typeof parsed.fats !== "number" || parsed.fats < 20 || parsed.fats > 300)) delete parsed.fats;
          if (parsed.water && (typeof parsed.water !== "number" || parsed.water < 1000 || parsed.water > 10000)) delete parsed.water;
          if (parsed.sleep && (typeof parsed.sleep !== "number" || parsed.sleep < 4 || parsed.sleep > 16)) delete parsed.sleep;
          setCustomTargets(parsed);
        }
      } catch {}
    }

    const savedCustomEx = JSON.parse(localStorage.getItem(`${email}_customExercises`) || "{}");
    setCustomExerciseDB(savedCustomEx);

    const savedMeals = JSON.parse(localStorage.getItem(`${email}_customMeals`) || "[]");
    setCustomMeals(savedMeals);

    // DETERMINE DATE RANGE: Plan start date - 7 days to 30 days forward
    const allPlans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
    const activePlanObj = allPlans.find((p: any) => p.name === plan);
    let planStartDate = activePlanObj?.startDate ? new Date(activePlanObj.startDate) : new Date();
    
    const dates = [];
    // Start from 7 days before plan start (or earlier if specified)
    const rangeStart = new Date(planStartDate);
    rangeStart.setDate(rangeStart.getDate() - 7);
    
    // End at 30 days after today
    const today = new Date();
    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
    
    for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    setPlanDays(dates);

    if (email && plan) {
      loadDayData(email, plan, selectedDate);
    }
    setSearchResults([...defaultFoods, ...savedMeals]);
  }, [selectedDate]);

  const loadDayData = (email: string, plan: string, date: string) => {
    const meals = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
    const exercises = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
    const water = JSON.parse(localStorage.getItem(`${email}_${plan}_waterIntake`) || "{}");

    const dayMeals = meals.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === date);
    const dayExercises = exercises.filter((e: any) => new Date(e.date).toISOString().split('T')[0] === date);

    setLoggedMeals(dayMeals);
    setExerciseLogs(dayExercises);
    setWaterIntake(water[date] || 0);

    // Load sleep
    const sleepLogs = JSON.parse(localStorage.getItem(`${email}_${plan}_sleepLogs`) || "{}");
    const daySlp = sleepLogs[date];
    if (daySlp) {
      // Support both single-entry ({hours,quality}) and multiple entries ([{...},...])
      if (Array.isArray(daySlp)) {
        const total = daySlp.reduce((s: number, e: any) => s + (e.hours || 0), 0);
        const qualities: Record<string, number> = {};
        daySlp.forEach((e: any) => { if (e.quality) qualities[e.quality] = (qualities[e.quality] || 0) + 1; });
        const most = Object.keys(qualities).length ? Object.keys(qualities).reduce((a, b) => qualities[a] > qualities[b] ? a : b) : "Good";
        setSavedSleep({ hours: total, quality: most });
        setSleepHours(total);
        setSleepQuality(most);
        setSleepEntries(daySlp);
      } else {
        setSavedSleep(daySlp);
        setSleepHours(daySlp.hours);
        setSleepQuality(daySlp.quality);
        setSleepEntries([daySlp]);
      }
    } else { setSavedSleep(null); setSleepHours(""); setSleepQuality("Good"); }
  };

  // countdown timer for next weigh-in (DD:HH:MM:SS)
  useEffect(() => {
    if (!nextWeighIn) {
      setWeighInCountdown("");
      return;
    }
    let mounted = true;
    const update = () => {
      const now = new Date();
      const target = new Date(nextWeighIn as string);
      let diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      const days = Math.floor(diff / 86400);
      diff = diff % 86400;
      const hours = Math.floor(diff / 3600);
      diff = diff % 3600;
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      const formatted = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      if (mounted) setWeighInCountdown(formatted);
    };
    update();
    const id = setInterval(update, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [nextWeighIn]);

  const handleDeleteSleepEntry = (index: number) => {
    if (!userEmail || !activePlan) return;
    const sleepLogs = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_sleepLogs`) || "{}");
    const entries = Array.isArray(sleepLogs[selectedDate]) ? [...sleepLogs[selectedDate]] : (sleepLogs[selectedDate] ? [sleepLogs[selectedDate]] : []);
    if (index < 0 || index >= entries.length) return;
    const [removed] = entries.splice(index, 1);
    if (entries.length === 0) {
      delete sleepLogs[selectedDate];
    } else {
      sleepLogs[selectedDate] = entries;
    }
    localStorage.setItem(`${userEmail}_${activePlan}_sleepLogs`, JSON.stringify(sleepLogs));
    setSleepEntries(entries);
    // recompute savedSleep
    if (entries.length > 0) {
      const total = entries.reduce((s: number, e: any) => s + (e.hours || 0), 0);
      const qualities: Record<string, number> = {};
      entries.forEach((e: any) => { if (e.quality) qualities[e.quality] = (qualities[e.quality] || 0) + 1; });
      const most = Object.keys(qualities).length ? Object.keys(qualities).reduce((a, b) => qualities[a] > qualities[b] ? a : b) : "Good";
      setSavedSleep({ hours: total, quality: most });
      setSleepHours(total);
      setSleepQuality(most);
    } else {
      setSavedSleep(null);
      setSleepHours("");
      setSleepQuality("Good");
    }
    setLastDeletedSleep({ entry: removed, index });
  };

  const handleUndoDeleteSleep = () => {
    if (!userEmail || !activePlan || !lastDeletedSleep) return;
    const sleepLogs = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_sleepLogs`) || "{}");
    const entries = Array.isArray(sleepLogs[selectedDate]) ? [...sleepLogs[selectedDate]] : (sleepLogs[selectedDate] ? [sleepLogs[selectedDate]] : []);
    const idx = Math.min(lastDeletedSleep.index, entries.length);
    entries.splice(idx, 0, lastDeletedSleep.entry);
    sleepLogs[selectedDate] = entries;
    localStorage.setItem(`${userEmail}_${activePlan}_sleepLogs`, JSON.stringify(sleepLogs));
    setSleepEntries(entries);
    // recompute savedSleep
    const total = entries.reduce((s: number, e: any) => s + (e.hours || 0), 0);
    const qualities: Record<string, number> = {};
    entries.forEach((e: any) => { if (e.quality) qualities[e.quality] = (qualities[e.quality] || 0) + 1; });
    const most = Object.keys(qualities).length ? Object.keys(qualities).reduce((a, b) => qualities[a] > qualities[b] ? a : b) : "Good";
    setSavedSleep({ hours: total, quality: most });
    setSleepHours(total);
    setSleepQuality(most);
    setLastDeletedSleep(null);
  };

  // Diet Handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFoods = [...defaultFoods, ...customMeals];
    if (!query) {
      setSearchResults(allFoods);
      return;
    }
    const filtered = allFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
    setSearchResults(filtered);
    setLoading(true);
    try {
      const res = await fetch(`/api/food/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      const apiFoods = (data.foods || []).map((f: any) => ({
        name: f.description,
        calories: getNutrientValue(f, "Energy"),
        protein: getNutrientValue(f, "Protein"),
        carbs: getNutrientValue(f, "Carbohydrate"),
        fat: getNutrientValue(f, "Total lipid"),
      }));
      setSearchResults([...filtered, ...apiFoods, ...customMeals]);
    } catch (error) {
      console.error("Error searching food:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNutrientValue = (food: any, name: string) => {
    const nutrient = food.foodNutrients?.find((n: any) => n.nutrientName.toLowerCase().includes(name.toLowerCase()));
    return nutrient ? Math.round(nutrient.value) : 0;
  };

  const handleLogMeal = (food: FoodItem) => {
    if (!userEmail || !activePlan) return;
    const currentLogged = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const newMeal = { ...food, date: new Date(selectedDate).toISOString() };
    const updated = [...currentLogged, newMeal];
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updated));
    setLoggedMeals(updated.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === selectedDate));
    alert(`${food.name} added!`);
  };

  const handleSaveCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !activePlan) {
      alert("Please select a plan first before saving a custom meal.");
      return;
    }
    if (!mealName || !calories) {
      alert("Please provide a meal name and calories.");
      return;
    }

    const customMeal = {
      name: mealName.trim(),
      calories: parseFloat(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    };

    let updatedCustomMeals = customMeals;
    if (savePermanent) {
      const savedMeals = JSON.parse(localStorage.getItem(`${userEmail}_customMeals`) || "[]");
      updatedCustomMeals = [...savedMeals, customMeal];
      localStorage.setItem(`${userEmail}_customMeals`, JSON.stringify(updatedCustomMeals));
      setCustomMeals(updatedCustomMeals);
    }

    const currentLogged = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const loggedMeal = { ...customMeal, date: new Date(selectedDate).toISOString(), id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}` };
    const updatedLogged = [...currentLogged, loggedMeal];
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updatedLogged));
    setLoggedMeals(updatedLogged.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === selectedDate));

    setShowCustomForm(false);
    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setSavePermanent(false);
    setSearchResults([...defaultFoods, ...updatedCustomMeals]);
    alert(savePermanent ? "Custom meal saved permanently and added to today's log!" : "Custom meal added to today's log!");
  };

  const handleRemoveMeal = (index: number) => {
    if (!userEmail || !activePlan) return;
    const allLogged = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const currentMeal = loggedMeals[index];
    let removed = false;
    if (currentMeal && currentMeal.id) {
      const updated = allLogged.filter((m: any) => m.id !== currentMeal.id);
      localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updated));
      setLoggedMeals(updated.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === selectedDate));
      removed = true;
    }
    if (!removed) {
      // fallback: remove only the first matching entry (by fields)
      const matchIdx = allLogged.findIndex((m: any) => m.date === currentMeal.date && m.name === currentMeal.name && (m.calories || 0) === (currentMeal.calories || 0) && (m.protein || 0) === (currentMeal.protein || 0) && (m.fat || 0) === (currentMeal.fat || 0));
      if (matchIdx !== -1) {
        allLogged.splice(matchIdx, 1);
        localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(allLogged));
      }
      setLoggedMeals(allLogged.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === selectedDate));
    }
  };

  // Exercise Handlers
  const handleBodyPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const part = e.target.value;
    setBodyPart(part);
    const available = getAvailableExercises(part);
    setExercise(available[0] || "");
  };

  const getAvailableExercises = (part: string) => {
    const defaults = defaultExerciseDatabase[part] || [];
    const customs = customExerciseDB[part] || [];
    return [...defaults, ...customs];
  };

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomExercise || !userEmail) return;

    const updatedDB = { ...customExerciseDB };
    if (!updatedDB[bodyPart]) updatedDB[bodyPart] = [];
    
    if (updatedDB[bodyPart].includes(newCustomExercise) || defaultExerciseDatabase[bodyPart]?.includes(newCustomExercise)) {
      alert("Exercise already exists!");
      return;
    }

    updatedDB[bodyPart].push(newCustomExercise);
    localStorage.setItem(`${userEmail}_customExercises`, JSON.stringify(updatedDB));
    setCustomExerciseDB(updatedDB);
    setExercise(newCustomExercise);
    setNewCustomExercise("");
    alert(`Custom exercise "${newCustomExercise}" saved for ${bodyPart}!`);
  };

  const handleRemoveCustomExercise = (name: string) => {
    if (!userEmail) return;
    if (!confirm(`Remove custom exercise "${name}" from ${bodyPart}?`)) return;
    const updatedDB = { ...customExerciseDB };
    if (updatedDB[bodyPart]) {
      updatedDB[bodyPart] = updatedDB[bodyPart].filter((e: string) => e !== name);
      if (updatedDB[bodyPart].length === 0) delete updatedDB[bodyPart];
      localStorage.setItem(`${userEmail}_customExercises`, JSON.stringify(updatedDB));
      setCustomExerciseDB(updatedDB);
      // if the removed exercise is currently selected, reset to first available
      if (exercise === name) {
        const avail = getAvailableExercises(bodyPart);
        setExercise(avail[0] || "");
      }
      alert(`Removed custom exercise "${name}"`);
    }
  };

  const handleWeightModifier = (mod: number) => {
    const currentVal = parseFloat(weight) || 0;
    const newVal = Math.max(0, currentVal + mod);
    setWeight(newVal % 1 === 0 ? newVal.toString() : newVal.toFixed(2));
  };

  const handleRepsModifier = (mod: number) => {
    const currentVal = parseInt(reps) || 0;
    const newVal = Math.max(0, currentVal + mod);
    setReps(newVal.toString());
  };

  const handleSameAsLast = () => {
    const savedLogs = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_exerciseLogs`) || "[]");
    if (savedLogs.length > 0) {
      const lastLog = savedLogs[savedLogs.length - 1];
      setWeight(lastLog.weight.toString());
      setReps(lastLog.reps.toString());
      setBodyPart(lastLog.bodyPart);
      setExercise(lastLog.exercise);
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !activePlan || !exercise) return;

    const type = getExerciseTrackingType(exercise, bodyPart);
    let finalWeight = 0;
    let finalReps = 0;
    let finalOneRM = 0;

    if (type === "Time") {
      const minVal = parseInt(minutes) || 0;
      const secVal = parseInt(seconds) || 0;
      const totalSec = minVal * 60 + secVal;
      if (totalSec <= 0) {
        alert("Please enter a valid duration!");
        return;
      }
      finalWeight = 0;
      finalReps = totalSec;
      finalOneRM = totalSec;
    } else if (type === "Reps") {
      const repsVal = parseInt(reps) || 0;
      if (repsVal <= 0) {
        alert("Please enter reps!");
        return;
      }
      finalWeight = parseFloat(weight) || 0;
      finalReps = repsVal;
      finalOneRM = repsVal;
    } else {
      if (!weight || !reps) {
        alert("Please enter weight and reps!");
        return;
      }
      finalWeight = parseFloat(weight);
      finalReps = parseInt(reps);
      finalOneRM = calculateOneRM(finalWeight, finalReps);
    }

    const newLog = {
      date: new Date(selectedDate).toISOString(),
      bodyPart,
      exercise,
      weight: finalWeight,
      reps: finalReps,
      oneRM: Math.round(finalOneRM * 10) / 10,
      id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    };
    const savedLogs = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_exerciseLogs`) || "[]");
    const updatedLogs = [...savedLogs, newLog];
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updatedLogs));
    setExerciseLogs(updatedLogs.filter((e: any) => new Date(e.date).toISOString().split('T')[0] === selectedDate));
    setMinutes("");
    setSeconds("");
    alert(`Logged set for ${exercise}! (Values kept for next set auto-fill)`);
  };

  const handleRemoveLog = (index: number) => {
    if (!userEmail || !activePlan) return;
    const savedLogs = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_exerciseLogs`) || "[]");
    const currentLog = exerciseLogs[index];
    let removed = false;
    if (currentLog && currentLog.id) {
      const updated = savedLogs.filter((e: any) => e.id !== currentLog.id);
      localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updated));
      setExerciseLogs(updated.filter((e: any) => new Date(e.date).toISOString().split('T')[0] === selectedDate));
      removed = true;
    }
    if (!removed) {
      const matchIdx = savedLogs.findIndex((e: any) => e.date === currentLog.date && e.exercise === currentLog.exercise && e.weight === currentLog.weight && e.reps === currentLog.reps);
      if (matchIdx !== -1) {
        savedLogs.splice(matchIdx, 1);
        localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(savedLogs));
      }
      setExerciseLogs(savedLogs.filter((e: any) => new Date(e.date).toISOString().split('T')[0] === selectedDate));
    }
  };

  // Water Handlers

  const {
    targetCalories,
    targetProtein,
    targetFats,
    targetHydrationMl,
    sleepTarget: effectiveSleepTarget,
  } = computePlanTargets({
    startWeight,
    goalWeight,
    planDuration,
    goal,
    activityLevel,
    currentWeight,
    sleepTarget,
    customTargets,
  });

  const waterTarget = targetHydrationMl;

  const handleAddWater = (ml: number) => {
    if (!userEmail || !activePlan) return;
    const water = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_waterIntake`) || "{}");
    const current = water[selectedDate] || 0;
    water[selectedDate] = current + ml;
    localStorage.setItem(`${userEmail}_${activePlan}_waterIntake`, JSON.stringify(water));
    setWaterIntake(current + ml);
    // Track water intake history for undo functionality
    setWaterHistory(prev => [...prev, { ml, timestamp: new Date().toLocaleTimeString() }]);
    setCustomWaterInput("");
  };
  const handleClearAllWater = () => {
    if (!userEmail || !activePlan) return;
    const water = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_waterIntake`) || "{}");
    water[selectedDate] = 0;
    localStorage.setItem(`${userEmail}_${activePlan}_waterIntake`, JSON.stringify(water));
    setWaterIntake(0);
    setWaterHistory([]);
  };
  const handleUndoWater = () => {
    if (waterHistory.length === 0) return;
    const lastEntry = waterHistory[waterHistory.length - 1];
    const water = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_waterIntake`) || "{}");
    const current = water[selectedDate] || 0;
    const newAmount = Math.max(0, current - lastEntry.ml);
    water[selectedDate] = newAmount;
    localStorage.setItem(`${userEmail}_${activePlan}_waterIntake`, JSON.stringify(water));
    setWaterIntake(newAmount);
    setWaterHistory(prev => prev.slice(0, -1));
  };
  const handleUndoSpecificWater = (index: number) => {
    if (index < 0 || index >= waterHistory.length) return;
    const entryToRemove = waterHistory[index];
    const water = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_waterIntake`) || "{}");
    const current = water[selectedDate] || 0;
    const newAmount = Math.max(0, current - entryToRemove.ml);
    water[selectedDate] = newAmount;
    localStorage.setItem(`${userEmail}_${activePlan}_waterIntake`, JSON.stringify(water));
    setWaterIntake(newAmount);
    setWaterHistory(prev => prev.filter((_, i) => i !== index));
  };

  // Sleep Handler
  const handleSaveSleep = () => {
    if (!userEmail || !activePlan || sleepHours === "") return;
    const sleepLogs = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_sleepLogs`) || "{}");
    const entry = { hours: Number(sleepHours), quality: sleepQuality };
    const existing = sleepLogs[selectedDate];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(entry);
        sleepLogs[selectedDate] = existing;
      } else {
        sleepLogs[selectedDate] = [existing, entry];
      }
    } else {
      sleepLogs[selectedDate] = entry;
    }
    localStorage.setItem(`${userEmail}_${activePlan}_sleepLogs`, JSON.stringify(sleepLogs));
    // Update saved view to reflect potential aggregation
    const daySlp = sleepLogs[selectedDate];
    if (Array.isArray(daySlp)) {
      const total = daySlp.reduce((s: number, e: any) => s + (e.hours || 0), 0);
      const qualities: Record<string, number> = {};
      daySlp.forEach((e: any) => { if (e.quality) qualities[e.quality] = (qualities[e.quality] || 0) + 1; });
      const most = Object.keys(qualities).length ? Object.keys(qualities).reduce((a, b) => qualities[a] > qualities[b] ? a : b) : "Good";
      setSavedSleep({ hours: total, quality: most });
      setSleepHours(total);
      setSleepQuality(most);
    } else {
      setSavedSleep(daySlp);
      setSleepHours(daySlp.hours);
      setSleepQuality(daySlp.quality);
    }
    alert("Sleep logged!");
  };

  // --- COMPLEX DAY ANALYSIS ---
  const currentDiet = loggedMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const displayProtein = formatMacroValue(currentDiet.protein);
  const displayFat = formatMacroValue(currentDiet.fat);

  // --- Dynamic Scores for Journey Day Completion using centralized Goldilocks helper ---
  // Compute weighted sleep quality across all sleep entries for the day
  let weightedSleepHours = 0;
  let weightedQualityPct: number | null = null;
  if (Array.isArray(sleepEntries) && sleepEntries.length > 0) {
    const qualityMap: Record<string, number> = { Excellent: 100, Good: 90, Fair: 75, Poor: 60 };
    let totalHours = 0;
    let weightedSum = 0;
    sleepEntries.forEach((e: any) => {
      const hrs = Number(e.hours) || 0;
      const qLabel = e.quality || '';
      const qKey = Object.keys(qualityMap).find(k => k.toLowerCase() === String(qLabel).toLowerCase()) || null;
      const pct = qKey ? qualityMap[qKey] : (typeof e.quality === 'number' ? Number(e.quality) : 90);
      totalHours += hrs;
      weightedSum += hrs * pct;
    });
    weightedSleepHours = totalHours;
    if (totalHours > 0) weightedQualityPct = Math.round((weightedSum / totalHours));
  } else if (savedSleep) {
    weightedSleepHours = savedSleep.hours || 0;
    // savedSleep.quality may be a label — map it, or if numeric use as-is
    const qm = savedSleep.quality;
    if (typeof qm === 'number') weightedQualityPct = qm;
    else if (typeof qm === 'string') {
      const m: Record<string, number> = { Excellent: 100, Good: 90, Fair: 75, Poor: 60 };
      const key = Object.keys(m).find(k => k.toLowerCase() === qm.toLowerCase());
      weightedQualityPct = key ? m[key] : 90;
    }
  }

  const scoring = computeAdvancedGoldilocksScores({
    diet: { calories: currentDiet.calories, protein: currentDiet.protein, fat: currentDiet.fat },
    sleepHours: weightedSleepHours,
    sleepTarget: effectiveSleepTarget,
    sleepQuality: weightedQualityPct ?? undefined,
    sleepLogged: (weightedSleepHours || 0) > 0,
    dietLogged: (currentDiet.calories || 0) > 0 || (currentDiet.protein || 0) > 0 || (currentDiet.fat || 0) > 0,
    setsLogged: exerciseLogs.length,
    setsMixed: (() => {
      const counts: { [key: string]: number } = {};
      exerciseLogs.forEach(log => { counts[log.exercise] = (counts[log.exercise] || 0) + 1; });
      return Object.keys(counts).length > 1;
    })(),
    waterIntake,
    targetHydration: waterTarget,
    targetCalories,
    targetProtein,
    targetFats,
  });

  const allMetricsZero =
    (savedSleep?.hours ?? 0) === 0 &&
    currentDiet.calories === 0 &&
    currentDiet.protein === 0 &&
    exerciseLogs.length === 0 &&
    waterIntake === 0 &&
    currentDiet.fat === 0;

  const dayCompletionScore = allMetricsZero ? 0 : scoring.overallScore;

  const filteredDisplayLogs = exerciseLogs.filter(log => {
    if (filter === "All") return true;
    return log.bodyPart === filter;
  });

  const exerciseSetCounts: { [key: string]: number } = {};
  exerciseLogs.forEach(log => {
    exerciseSetCounts[log.exercise] = (exerciseSetCounts[log.exercise] || 0) + 1;
  });

  // Save Day Progress for Reports
  const executeCompleteDay = () => {
    if (!userEmail || !activePlan) return;

    const dayReport = {
      date: selectedDate,
      score: dayCompletionScore,
      calories: currentDiet.calories,
      protein: currentDiet.protein,
      fat: currentDiet.fat,
      carbs: currentDiet.carbs,
      water: waterIntake,
      sleepHours: savedSleep?.hours ?? null,
      sleepQuality: savedSleep?.quality ?? null,
      exercises: Object.keys(exerciseSetCounts).map(ex => ({
        name: ex,
        sets: exerciseSetCounts[ex],
        bestWeight: Math.max(...exerciseLogs.filter(l => l.exercise === ex).map(l => l.weight))
      }))
    };

    const savedReports = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_dailyReports`) || "[]");
    
    const existingIndex = savedReports.findIndex((r: any) => r.date === selectedDate);
    let updatedReports;
    if (existingIndex >= 0) {
      updatedReports = [...savedReports];
      updatedReports[existingIndex] = dayReport;
    } else {
      updatedReports = [...savedReports, dayReport];
    }

    localStorage.setItem(`${userEmail}_${activePlan}_dailyReports`, JSON.stringify(updatedReports));
    
    // Track completed day (for weekly progress)
    const completedDays = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_completedDays`) || "[]");
    if (!completedDays.includes(selectedDate)) {
      completedDays.push(selectedDate);
      localStorage.setItem(`${userEmail}_${activePlan}_completedDays`, JSON.stringify(completedDays));
      // Dispatch event to notify page of completed day
      window.dispatchEvent(new Event("gym-plan-updated"));
    }
    
    // Decrement days remaining for the 7‑day weigh‑in countdown
    const daysKey = `${userEmail}_${activePlan}_daysRemaining`;
    const storedDays = localStorage.getItem(daysKey);
    const currentDays = storedDays ? parseInt(storedDays, 10) : 7;
    const newDays = Math.max(0, currentDays - 1);
    localStorage.setItem(daysKey, newDays.toString());
    // If the countdown reached zero, schedule the actual weigh-in timestamp and reset counter
    if (newDays === 0 && userEmail && activePlan) {
      const next = new Date(selectedDate);
      // schedule immediate weigh-in (today) — app may prompt user now; also set next cycle 7 days later
      const nextCycle = new Date(selectedDate);
      nextCycle.setDate(nextCycle.getDate() + 7);
      localStorage.setItem(`${userEmail}_${activePlan}_nextWeighIn`, next.toISOString());
      localStorage.setItem(daysKey, '7');
      setNextWeighIn(next.toISOString());
    }
    // Log the updated days remaining for debugging
    console.log('Days remaining after decrement:', newDays);
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDateStr = currentDate.toISOString().split('T')[0];
    setSelectedDate(nextDateStr);
    setShowConfirmComplete(false);
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen pt-24 w-full">
      <header className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Fitness Journey</h1>
          <p className="text-gray-500 mt-1">Track your diet, exercise, and hydration day by day.</p>
        </div>
        {activePlan && (
          <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
            <span className="font-bold text-blue-500">Plan: {activePlan}</span>
            {weighInCountdown && (
              <div className="text-xs text-gray-500 mt-1">Next weigh-in: {weighInCountdown} (DD:HH:MM:SS)</div>
            )}
          </div>
        )}
      </header>

      {!activePlan ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-50 text-center w-full">
          <p className="text-gray-500">Please select or create a plan first to track your journey.</p>
          <Link href="/plans">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-2xl mt-4 font-medium hover:bg-blue-600 transition-colors">Go to Plans</button>
          </Link>
        </div>
      ) : (
        <div className="w-full space-y-8">
          
          {/* 1. Timeline Section (Starts from TODAY) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 w-full">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="text-blue-500" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Select Date</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {planDays.map((date) => {
                const d = new Date(date);
                const isSelected = date === selectedDate;
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center p-3 rounded-2xl min-w-16.25 transition-all ${
                      isSelected 
                        ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                        : isToday ? 'bg-blue-50 text-blue-500 border border-blue-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs uppercase font-medium">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-xl font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Day Summary & Water */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="text-blue-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Day Analysis</h2>
              </div>
              <div className="space-y-3">
                {/* Overall Score */}
                <div className="bg-blue-50 rounded-2xl p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-bold">Overall Daily Score</span>
                    <span className={`font-bold text-lg ${dayCompletionScore >= 80 ? 'text-green-500' : dayCompletionScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{dayCompletionScore}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${dayCompletionScore >= 80 ? 'bg-green-500' : dayCompletionScore >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${dayCompletionScore}%` }} />
                  </div>
                </div>

                {/* Per-metric rows */}
                {scoring?.analysis?.map((item) => {
                  const colorMap: Record<string, string> = {
                    sleep: "bg-purple-500",
                    calories: "bg-orange-400",
                    protein: "bg-blue-400",
                    workout: "bg-green-400",
                    hydration: "bg-cyan-400",
                    fats: "bg-purple-400",
                  };
                  const color = colorMap[item.key] || "bg-blue-400";
                  
                  const tone = item.penalty > 0 ? "text-red-600 bg-red-50 border-red-100" : "text-emerald-600 bg-emerald-50 border-emerald-100";
                  
                  const displayValue = item.key === "hydration"
                    ? `${formatLiters(Number(item.logged))} / ${formatLiters(item.target)}L`
                    : item.key === "workout"
                      ? (Number(item.logged) > 0 ? `${item.logged} sets done` : "Not done")
                      : `${item.logged} / ${item.target}${item.unit}`;

                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{item.label} ({Math.round(item.maxPoints)}%)</span>
                        <span className="font-medium text-gray-700">{displayValue}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${Math.min(item.score, 100)}%` }} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${tone}`}>
                          {item.penalty > 0 ? `Penalty: -${item.penalty.toFixed(1)} pts` : "On target"}
                        </span>
                        <span className="text-gray-500">{item.warning}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sleep / Recovery Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="text-purple-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Sleep & Recovery</h2>
              </div>
              <div className="space-y-3">
                {sleepEntries && sleepEntries.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Sleep logs for this day:</div>
                    <div className="space-y-2">
                      {sleepEntries.map((e, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium">{idx + 1}. {e.hours}h — {e.quality}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDeleteSleepEntry(idx)} className="text-red-500 hover:text-red-600 px-2 py-1 rounded">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {lastDeletedSleep && (
                      <div className="flex items-center gap-2">
                        <button onClick={handleUndoDeleteSleep} className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100">Undo Last Delete</button>
                      </div>
                    )}
                  </div>
                ) : savedSleep ? (
                  <div className={`p-3 rounded-2xl text-sm font-medium ${
                    savedSleep.hours >= effectiveSleepTarget - 1 && savedSleep.hours <= effectiveSleepTarget + 1
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                  }`}>
                    Last saved: {savedSleep.hours}h — {savedSleep.quality} quality
                    {savedSleep.hours >= effectiveSleepTarget - 1 && savedSleep.hours <= effectiveSleepTarget + 1
                      ? " ✅ On track"
                      : ` ⚠️ Target is ${effectiveSleepTarget}h`}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hours Slept</label>
                    <input
                      type="number" min="0" max="16" step="0.5"
                      value={sleepHours}
                      onChange={e => setSleepHours(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={`Target: ${effectiveSleepTarget}h`}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sleep Quality</label>
                    <select
                      value={sleepQuality}
                      onChange={e => setSleepQuality(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm focus:outline-none focus:border-purple-400"
                    >
                      {["Poor", "Fair", "Good", "Excellent"].map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSaveSleep}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-2xl text-sm font-medium transition-colors"
                >
                  Save Sleep Log
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Droplet className="text-blue-500" size={20} />
                    <h2 className="text-xl font-semibold text-gray-900">Water Intake</h2>
                  </div>
                  <span className="text-sm font-medium text-blue-500">Target: {formatLiters(waterTarget)}L</span>
                </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 font-medium">Hydration Level</span>
                    <span className="font-bold text-blue-500">{Math.round(scoring.waterScore)}%</span>
                  </div>
                  <ProgressBar label="" progress={scoring.waterScore} colorClass="bg-blue-400" showText={false} />
                </div>
                <div className="text-center text-lg font-bold text-gray-900 py-2">
                  {formatLiters(waterIntake)}L <span className="text-gray-500 text-sm font-normal">consumed</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => handleAddWater(250)} className="bg-blue-50 hover:bg-blue-100 text-blue-500 py-2.5 rounded-2xl text-sm font-medium transition-colors border border-blue-50">+250ml</button>
                  <button onClick={() => handleAddWater(500)} className="bg-blue-50 hover:bg-blue-100 text-blue-500 py-2.5 rounded-2xl text-sm font-medium transition-colors border border-blue-50">+500ml</button>
                  <button onClick={() => handleAddWater(1000)} className="bg-blue-50 hover:bg-blue-100 text-blue-500 py-2.5 rounded-2xl text-sm font-medium transition-colors border border-blue-50">+1L</button>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter ml..."
                    value={customWaterInput}
                    onChange={(e) => setCustomWaterInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      const ml = parseInt(customWaterInput);
                      if (!isNaN(ml) && ml > 0) {
                        handleAddWater(ml);
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <button
                    onClick={handleClearAllWater}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Clear All Water for Today
                  </button>
                  {waterHistory.length > 0 && (
                    <button
                      onClick={handleUndoWater}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      Undo Last
                    </button>
                  )}
                </div>
                {waterHistory.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Water History</span>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {waterHistory.map((entry, index) => (
                        <div key={`${entry.ml}-${index}`} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{entry.ml}ml at {entry.timestamp}</span>
                          <button
                            onClick={() => handleUndoSpecificWater(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
                            title="Remove specific entry"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Diet Log Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-2">
                <Coffee className="text-blue-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Diet Log</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-2xl text-sm font-medium transition-colors"
              >
                + Custom Meal
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuery(value);
                    if (!value) setSearchResults([...defaultFoods, ...customMeals]);
                  }} 
                  placeholder="Search food to add..." 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center min-w-[60px]">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </form>

            {showCustomForm && (
              <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Add Custom Meal</h3>
                    <p className="text-sm text-blue-600">Create a meal and optionally save it permanently for fast reuse.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
                <form onSubmit={handleSaveCustomMeal} className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-700">
                    Meal name
                    <input
                      type="text"
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Calories
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Protein (g)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Fat (g)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="flex items-center gap-2 md:col-span-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={savePermanent}
                      onChange={(e) => setSavePermanent(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Save this meal permanently for quick use later
                  </label>
                  <button
                    type="submit"
                    className="md:col-span-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-2xl text-sm font-medium transition-colors"
                  >
                    {savePermanent ? "Save permanently & add to today's log" : "Add custom meal to today's log"}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 max-h-60 overflow-y-auto p-1">
              {searchResults.map((food, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{food.name}</p>
                    <p className="text-xs text-gray-500">
                      {food.calories} kcal • P: {formatMacroValue(Number(food.protein))}g • F: {formatMacroValue(Number(food.fat))}g
                    </p>
                  </div>
                  <button onClick={() => handleLogMeal(food)} className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1">
                    <Plus size={16} /> Add
                  </button>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-gray-900 mb-3 text-lg">Logged Meals for this Day</h3>
            {loggedMeals.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-2xl">No meals logged for this day.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 text-gray-500">
                      <th className="py-2 font-medium">Food</th>
                      <th className="py-2 font-medium">Calories</th>
                      <th className="py-2 font-medium">Protein</th>
                      <th className="py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loggedMeals.map((meal, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-medium text-gray-900">{meal.name}</td>
                        <td className="py-3">{meal.calories} kcal</td>
                        <td className="py-3">{formatMacroValue(Number(meal.protein))}g</td>
                        <td className="py-3">
                          <button onClick={() => handleRemoveMeal(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Exercise Log Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 w-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Dumbbell className="text-blue-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Exercise Log</h2>
              </div>
              <div className="text-sm text-gray-500">
                Total Sets Today: <span className="font-bold text-blue-500">{exerciseLogs.length}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-2xl w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
                  <select value={bodyPart} onChange={handleBodyPartChange} className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500">
                    {Object.keys(defaultExerciseDatabase).map(part => <option key={part} value={part}>{part}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
                  <select value={exercise} onChange={(e) => setExercise(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500">
                    {getAvailableExercises(bodyPart).map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>

              <form onSubmit={handleAddCustomExercise} className="flex gap-2 items-center border-t border-gray-50 pt-3 mt-1">
                <input 
                  type="text" 
                  value={newCustomExercise} 
                  onChange={(e) => setNewCustomExercise(e.target.value)} 
                  placeholder="Add new custom exercise..." 
                  className="flex-1 bg-white border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="bg-blue-50 text-blue-500 hover:bg-blue-100 px-4 py-2 rounded-2xl text-sm font-medium transition-colors">
                  Save Exercise
                </button>
              </form>

              {/* Custom exercises for this body part (with remove option) */}
              { (customExerciseDB[bodyPart] || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(customExerciseDB[bodyPart] || []).map((ce: string) => (
                    <span key={ce} className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1 text-sm">
                      <button type="button" onClick={() => setExercise(ce)} className="text-slate-700 hover:text-blue-600">{ce}</button>
                      <button type="button" onClick={() => handleRemoveCustomExercise(ce)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddLog} className="space-y-4 border-t border-gray-50 pt-3">
                {getExerciseTrackingType(exercise, bodyPart) === "Time" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                      <input type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="e.g. 2" required className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seconds</label>
                      <input type="number" min="0" max="59" value={seconds} onChange={(e) => setSeconds(e.target.value)} placeholder="e.g. 30" required className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                ) : getExerciseTrackingType(exercise, bodyPart) === "Reps" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (optional)</label>
                      <input type="number" step="any" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Bodyweight" className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        <button type="button" onClick={() => handleWeightModifier(-5)} className="text-[9px] font-extrabold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">-5kg</button>
                        <button type="button" onClick={() => handleWeightModifier(-2.5)} className="text-[9px] font-extrabold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">-2.5kg</button>
                        <button type="button" onClick={() => handleWeightModifier(2.5)} className="text-[9px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-500 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">+2.5kg</button>
                        <button type="button" onClick={() => handleWeightModifier(5)} className="text-[9px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-500 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">+5kg</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                      <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="e.g. 15" required className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        <button type="button" onClick={() => handleRepsModifier(-1)} className="text-[9px] font-extrabold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">-1</button>
                        <button type="button" onClick={() => handleRepsModifier(1)} className="text-[9px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-500 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">+1</button>
                        <button type="button" onClick={handleSameAsLast} className="text-[9px] font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">Last Set 🔁</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input type="number" step="any" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" required className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        <button type="button" onClick={() => handleWeightModifier(-5)} className="text-[9px] font-extrabold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">-5kg</button>
                        <button type="button" onClick={() => handleWeightModifier(-2.5)} className="text-[9px] font-extrabold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">-2.5kg</button>
                        <button type="button" onClick={() => handleWeightModifier(2.5)} className="text-[9px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-500 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">+2.5kg</button>
                        <button type="button" onClick={() => handleWeightModifier(5)} className="text-[9px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-500 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">+5kg</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                      <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="0" required className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        <button type="button" onClick={() => handleRepsModifier(-1)} className="text-[9px] font-extrabold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">-1</button>
                        <button type="button" onClick={() => handleRepsModifier(1)} className="text-[9px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-500 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">+1</button>
                        <button type="button" onClick={handleSameAsLast} className="text-[9px] font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer">Last Set 🔁</button>
                      </div>
                    </div>
                  </div>
                )}
                <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl text-sm font-medium transition-colors shadow-sm">+ Add Set to Day</button>
              </form>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">Logged Sets</h3>
              <div className="flex gap-2">
                {["All", "Chest", "Back", "Legs"].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f)} 
                    className={`text-xs px-3 py-1.5 rounded-2xl font-medium transition-colors ${filter === f ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            {exerciseLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-2xl">No exercises logged for this day.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 text-gray-500">
                      <th className="py-2 font-medium">Exercise</th>
                      <th className="py-2 font-medium">Category</th>
                      <th className="py-2 font-medium">Weight</th>
                      <th className="py-2 font-medium">Reps</th>
                      <th className="py-2 font-medium">Sets Done Today</th>
                      <th className="py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDisplayLogs.map((log, index) => {
                      const trackingType = getExerciseTrackingType(log.exercise, log.bodyPart);
                      return (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 font-medium text-gray-900">{log.exercise}</td>
                          <td className="py-3 text-gray-500">{log.bodyPart}</td>
                          {trackingType === "Time" ? (
                            <>
                              <td className="py-3 text-gray-400">—</td>
                              <td className="py-3 font-medium text-gray-900">{formatExerciseValue(log.reps, "Time")}</td>
                            </>
                          ) : trackingType === "Reps" ? (
                            <>
                              <td className="py-3">{log.weight > 0 ? `${log.weight} kg` : "Bodyweight"}</td>
                              <td className="py-3 font-medium text-gray-900">{formatExerciseValue(log.reps, "Reps")}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-3">{log.weight} kg</td>
                              <td className="py-3">{log.reps} reps <span className="text-xs text-gray-400 ml-2">(1RM: {log.oneRM}kg)</span></td>
                            </>
                          )}
                          <td className="py-3 font-semibold text-blue-500">
                            {exerciseSetCounts[log.exercise] || 1} {exerciseSetCounts[log.exercise] === 1 ? 'set' : 'sets'}
                          </td>
                          <td className="py-3">
                            <button onClick={() => handleRemoveLog(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. Complete Day Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 text-center w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to wrap up?</h3>
            <p className="text-sm text-gray-500 mb-4">Clicking this will save your progress for today to your reports.</p>
            <button 
              onClick={() => setShowConfirmComplete(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-2xl font-bold text-lg transition-colors flex items-center gap-2 shadow-md mx-auto cursor-pointer"
            >
              <Check size={24} /> Complete Today's Progress
            </button>
          </div>

          {/* Confirmation Modal */}
          {showConfirmComplete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-3xl max-w-sm w-full mx-4 shadow-xl text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Day?</h3>
                <p className="text-gray-500 mb-6">Are you sure you want to finalize today's progress? This will lock in your data for reports.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowConfirmComplete(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium cursor-pointer">Cancel</button>
                  <button onClick={executeCompleteDay} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-medium shadow-sm cursor-pointer">Confirm</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function Journey() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JourneyContent />
    </Suspense>
  );
}
