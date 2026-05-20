"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Calendar as CalendarIcon, CheckCircle2, Trash2, Plus, Search, Loader2, ArrowRight, Dumbbell, Coffee, Droplet, Scale, PieChart, Check, Moon } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getExerciseTrackingType, formatExerciseValue, calculateOneRM } from "@/utils/oneRM";

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
  
  // Diet States
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Sleep States
  const [sleepHours, setSleepHours] = useState<number | "">("");
  const [sleepQuality, setSleepQuality] = useState("Good");
  const [savedSleep, setSavedSleep] = useState<{ hours: number; quality: string } | null>(null);

  const [startWeight, setStartWeight] = useState(80);
  const [goalWeight, setGoalWeight] = useState(75);
  const [planDuration, setPlanDuration] = useState(3);
  const [currentWeight, setCurrentWeight] = useState(80);
  const [sleepTarget, setSleepTargetState] = useState(8);
  const [goal, setGoal] = useState("General Fitness");
  const [activityLevel, setActivityLevel] = useState("moderate");

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
    const currentPlan = plans.find((p: any) => p.name === plan);
    if (currentPlan) {
      setCurrentWeight(currentPlan.weight);
      setStartWeight(currentPlan.weight);
      setGoalWeight(currentPlan.goalWeight);
      setPlanDuration(currentPlan.duration);
      setSleepTargetState(currentPlan.sleepTarget || 8);
      setGoal(currentPlan.goal || "General Fitness");
      setActivityLevel(currentPlan.activityLevel || "moderate");
    }

    const savedCustomEx = JSON.parse(localStorage.getItem(`${email}_customExercises`) || "{}");
    setCustomExerciseDB(savedCustomEx);

    // START FROM TODAY (0 to 30 days in future)
    const today = new Date();
    const dates = [];
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    setPlanDays(dates);

    if (email && plan) {
      loadDayData(email, plan, selectedDate);
    }
    setSearchResults(defaultFoods);
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
    if (daySlp) { setSavedSleep(daySlp); setSleepHours(daySlp.hours); setSleepQuality(daySlp.quality); }
    else { setSavedSleep(null); setSleepHours(""); setSleepQuality("Good"); }
  };

  // Diet Handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) {
      setSearchResults(defaultFoods);
      return;
    }
    const filtered = defaultFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
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
      setSearchResults([...filtered, ...apiFoods]);
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

  const handleRemoveMeal = (index: number) => {
    if (!userEmail || !activePlan) return;
    const allLogged = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const currentMeal = loggedMeals[index];
    const updated = allLogged.filter((m: any) => m.date !== currentMeal.date || m.name !== currentMeal.name);
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updated));
    setLoggedMeals(updated.filter((m: any) => new Date(m.date).toISOString().split('T')[0] === selectedDate));
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
    const updated = savedLogs.filter((e: any) => !(e.date === currentLog.date && e.exercise === currentLog.exercise && e.weight === currentLog.weight && e.reps === currentLog.reps));
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updated));
    setExerciseLogs(updated.filter((e: any) => new Date(e.date).toISOString().split('T')[0] === selectedDate));
  };

  // Water Handlers
  // Dynamic scientific water target formula
  const baseHydration = currentWeight * 35;
  const gainGoalHydration = /muscle|bulk|gain/i.test(goal);
  const goalBonusHydration = gainGoalHydration ? 500 : 0;
  const hydrationMultipliers: Record<string, number> = { sedentary: 1.0, light: 1.1, moderate: 1.2, active: 1.3 };
  const hydrationMultiplier = hydrationMultipliers[activityLevel?.toLowerCase()] ?? 1.2;
  const waterTarget = Math.round((baseHydration + goalBonusHydration) * hydrationMultiplier);
  const handleAddWater = (ml: number) => {
    if (!userEmail || !activePlan) return;
    const water = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_waterIntake`) || "{}");
    const current = water[selectedDate] || 0;
    water[selectedDate] = current + ml;
    localStorage.setItem(`${userEmail}_${activePlan}_waterIntake`, JSON.stringify(water));
    setWaterIntake(current + ml);
  };

  // Sleep Handler
  const handleSaveSleep = () => {
    if (!userEmail || !activePlan || sleepHours === "") return;
    const sleepLogs = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_sleepLogs`) || "{}");
    const entry = { hours: Number(sleepHours), quality: sleepQuality };
    sleepLogs[selectedDate] = entry;
    localStorage.setItem(`${userEmail}_${activePlan}_sleepLogs`, JSON.stringify(sleepLogs));
    setSavedSleep(entry);
    alert("Sleep logged!");
  };

  // --- COMPLEX DAY ANALYSIS ---
  const currentDiet = loggedMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // --- Complex Target Calculations ---
  const goalWeightLbs = goalWeight * 2.20462;
  const maintenanceTDEE = goalWeightLbs * 15;
  const dailyCalorieAdjustment = ((goalWeight - startWeight) * 2.20462 * 3500) / (planDuration * 30);
  let targetCalories = Math.round(maintenanceTDEE + dailyCalorieAdjustment);
  if (targetCalories < 1200 && startWeight > goalWeight) targetCalories = 1200; // Safety floor
  
  const targetProtein = Math.round(currentWeight * 1.8);
  const targetFats = Math.round(goalWeightLbs * 0.4);

  // --- Dynamic Scores for Journey Day Completion using Goldilocks Zone Penalty Rule ---
  
  // Sleep (30% - Max 30 points. Deduct 2 points for every 1 hour under or over target)
  const sleepHoursVal = savedSleep ? savedSleep.hours : 0;
  const sleepPoints = Math.max(0, 30 - Math.abs(sleepHoursVal - sleepTarget) * 2);
  const sleepScore = (sleepPoints / 30) * 100;

  // Calories (25% - Max 25 points. Deduct 1 point for every 100 calories under or over target)
  const calPoints = Math.max(0, 25 - (Math.abs(currentDiet.calories - targetCalories) / 100) * 1);
  const calScore = (calPoints / 25) * 100;

  // Protein (15% - Max 15 points. Deduct 1 point for every 5g under or over target)
  const proteinPoints = Math.max(0, 15 - (Math.abs(currentDiet.protein - targetProtein) / 5) * 1);
  const proteinScore = (proteinPoints / 15) * 100;

  // Workout (12% - Max 12 points. Deduct 2 points for every 1 set under or over target of 6 sets)
  const exercisePoints = Math.max(0, 12 - Math.abs(exerciseLogs.length - 6) * 2);
  const exerciseScore = (exercisePoints / 12) * 100;

  // Hydration (10% - Max 10 points. Deduct 1 point for every 250ml under or over target)
  const waterPoints = Math.max(0, 10 - (Math.abs(waterIntake - waterTarget) / 250) * 1);
  const waterScore = (waterPoints / 10) * 100;

  // Fats (8% - Max 8 points. Deduct 1 point for every 5g under or over target)
  const fatPoints = Math.max(0, 8 - (Math.abs(currentDiet.fat - targetFats) / 5) * 1);
  const fatScore = (fatPoints / 8) * 100;

  // Overall Score (Tally out of exactly 100 points)
  const dayCompletionScore = Math.round(
    (sleepScore * 0.30) +
    (calScore * 0.25) +
    (proteinScore * 0.15) +
    (exerciseScore * 0.12) +
    (waterScore * 0.10) +
    (fatScore * 0.08)
  );

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
    alert(`Progress for ${selectedDate} saved successfully!`);

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
                    className={`flex flex-col items-center p-3 rounded-2xl min-w-[65px] transition-all ${
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
                {[
                  { label: "Sleep (30%)", val: savedSleep ? `${savedSleep.hours} / ${sleepTarget}h` : `0 / ${sleepTarget}h`, pct: sleepScore, color: "bg-purple-500" },
                  { label: "Calories (25%)", val: `${currentDiet.calories} / ${targetCalories} kcal`, pct: calScore, color: "bg-orange-400" },
                  { label: "Protein (15%)", val: `${Math.round(currentDiet.protein)} / ${targetProtein}g`, pct: proteinScore, color: "bg-blue-400" },
                  { label: "Workout (12%)", val: exerciseLogs.length > 0 ? `${exerciseLogs.length} sets done` : "Not done", pct: exerciseScore, color: "bg-green-400" },
                  { label: "Hydration (10%)", val: `${(waterIntake/1000).toFixed(1)} / ${(waterTarget/1000).toFixed(1)}L`, pct: waterScore, color: "bg-cyan-400" },
                  { label: "Fats (8%)", val: `${Math.round(currentDiet.fat)} / ${targetFats}g`, pct: fatScore, color: "bg-purple-400" },
                ].map(({ label, val, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-700">{val}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sleep / Recovery Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="text-purple-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Sleep & Recovery</h2>
              </div>
              <div className="space-y-3">
                {savedSleep && (
                  <div className={`p-3 rounded-2xl text-sm font-medium ${
                    savedSleep.hours >= sleepTarget - 1 && savedSleep.hours <= sleepTarget + 1
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                  }`}>
                    Last saved: {savedSleep.hours}h — {savedSleep.quality} quality
                    {savedSleep.hours >= sleepTarget - 1 && savedSleep.hours <= sleepTarget + 1
                      ? " ✅ On track"
                      : ` ⚠️ Target is ${sleepTarget}h`}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hours Slept</label>
                    <input
                      type="number" min="0" max="16" step="0.5"
                      value={sleepHours}
                      onChange={e => setSleepHours(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={`Target: ${sleepTarget}h`}
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
                <span className="text-sm font-medium text-blue-500">Target: {(waterTarget / 1000).toFixed(1)}L</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 font-medium">Hydration Level</span>
                    <span className="font-bold text-blue-500">{Math.round(waterScore)}%</span>
                  </div>
                  <ProgressBar label="" progress={waterScore} colorClass="bg-blue-400" showText={false} />
                </div>
                <div className="text-center text-lg font-bold text-gray-900 py-2">
                  {(waterIntake / 1000).toFixed(1)}L <span className="text-gray-500 text-sm font-normal">consumed</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => handleAddWater(250)} className="bg-blue-50 hover:bg-blue-100 text-blue-500 py-2.5 rounded-2xl text-sm font-medium transition-colors border border-blue-50">+250ml</button>
                  <button onClick={() => handleAddWater(500)} className="bg-blue-50 hover:bg-blue-100 text-blue-500 py-2.5 rounded-2xl text-sm font-medium transition-colors border border-blue-50">+500ml</button>
                  <button onClick={() => handleAddWater(1000)} className="bg-blue-50 hover:bg-blue-100 text-blue-500 py-2.5 rounded-2xl text-sm font-medium transition-colors border border-blue-50">+1L</button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Diet Log Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 w-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Coffee className="text-blue-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Diet Log</h2>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setSearchResults(defaultFoods); }} 
                  placeholder="Search food to add..." 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:outline-none focus:border-blue-500 text-sm text-gray-900"
                />
              </div>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center min-w-[60px]">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 max-h-60 overflow-y-auto p-1">
              {searchResults.map((food, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{food.name}</p>
                    <p className="text-xs text-gray-500">{food.calories} kcal • P: {food.protein}g</p>
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
                        <td className="py-3">{meal.protein}g</td>
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
