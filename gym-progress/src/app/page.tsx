"use client";

import React, { useState, useEffect } from "react";
import ProgressBar from "@/components/ProgressBar";
import { Flame, Plus, Target, ChevronDown, Scale, AlertCircle, TrendingUp, BarChart2, Coffee, Dumbbell, Droplets, ArrowRight, Moon, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import StrengthChart from "@/components/charts/StrengthChart";
import GoalChart from "@/components/charts/GoalChart";
import { getExerciseTrackingType, formatExerciseValue } from "@/utils/oneRM";

export default function Dashboard() {
  const TEST_MODE = true; // set to true for rapid testing
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  // Exercise States for Chart
  const [selectedBodyPart, setSelectedBodyPart] = useState("Chest");
  const [selectedExercise, setSelectedExercise] = useState("Bench Press");
  const [customExerciseDB, setCustomExerciseDB] = useState<{ [key: string]: string[] }>({});

  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [weeklyWeights, setWeeklyWeights] = useState<{ date: string, weight: number }[]>([]);
  const [loggedWater, setLoggedWater] = useState(0); // in ml
  const [sleepLogs, setSleepLogs] = useState<{ [key: string]: { hours: number; quality: string } }>({});
  const [sleepTarget, setSleepTarget] = useState(8);
  const [customTargets, setCustomTargets] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [showRecommendationDetails, setShowRecommendationDetails] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Current Plan Details
  const [startWeight, setStartWeight] = useState(80);
  const [goalWeight, setGoalWeight] = useState(75);
  const [planDuration, setPlanDuration] = useState(3); // in months
  const [planStartDate, setPlanStartDate] = useState<string | null>(null);

  // Form for weekly weight
  const [newWeeklyWeight, setNewWeeklyWeight] = useState("");
  const [showPenaltyDetails, setShowPenaltyDetails] = useState(false);

  // Set View Toggle
  const [setViewMode, setSetViewMode] = useState<"Today" | "Yesterday">("Today");

  const defaultExerciseDatabase: { [key: string]: string[] } = {
    Chest: ["Bench Press", "Incline Dumbbell Press", "Chest Flyes"],
    Back: ["Deadlift", "Pull-ups", "Bent Over Rows"],
    Legs: ["Squat", "Leg Press", "Calf Raises"],
    Shoulders: ["Overhead Press", "Lateral Raises"],
    Arms: ["Bicep Curls", "Tricep Pushdowns"],
    Abs: ["Plank", "Crunches", "Leg Raises", "Russian Twists"],
  };

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const name = localStorage.getItem("userName");
    if (name) setUserName(name);

    if (email) {
      const plan = localStorage.getItem(`${email}_activePlan`);
      setActivePlan(plan);

      const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
      setSavedPlans(plans);

      const currentPlan = plans.find((p: any) => p.name === plan);
      if (currentPlan) {
        setStartWeight(currentPlan.weight);
        setGoalWeight(currentPlan.goalWeight);
        setPlanDuration(currentPlan.duration);
        setPlanStartDate(currentPlan.date || new Date().toISOString());

        const rawLogs = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
        // Normalize all dates to YYYY-MM-DD format
        const logs = rawLogs.map((l: any) => ({
          ...l,
          date: typeof l.date === 'string' && l.date.length > 10 ? l.date.split('T')[0] : l.date,
          setNumber: l.setNumber ?? 1,
        }));
        setExerciseLogs(logs);

        const meals = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
        setLoggedMeals(meals);

        const weights = JSON.parse(localStorage.getItem(`${email}_${plan}_weeklyWeights`) || "[]");
        setWeeklyWeights(weights);

        // Fetch sleep logs and sleep target
        const sleep = JSON.parse(localStorage.getItem(`${email}_${plan}_sleepLogs`) || "{}");
        setSleepLogs(sleep);
        setSleepTarget(currentPlan.sleepTarget || 8);

        // Reset or fetch water
        const todayStr = new Date().toDateString();
        const storedWater = localStorage.getItem(`${email}_${plan}_water_${todayStr}`);
        if (storedWater) setLoggedWater(parseInt(storedWater));
        else setLoggedWater(0);

        // Load custom targets
        const storedCustom = localStorage.getItem(`${email}_${plan}_customTargets`);
        if (storedCustom) {
          try {
            setCustomTargets(JSON.parse(storedCustom));
          } catch (e) {}
        }
      }

      const savedCustomEx = JSON.parse(localStorage.getItem(`${email}_customExercises`) || "{}");
      setCustomExerciseDB(savedCustomEx);
    }
  }, []);

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planName = e.target.value;
    localStorage.setItem(`${userEmail}_activePlan`, planName);
    setActivePlan(planName);
    window.location.reload(); // Quick refresh to update all states
  };

  const handleBodyPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const part = e.target.value;
    setSelectedBodyPart(part);
    const available = getAvailableExercises(part);
    setSelectedExercise(available[0] || "");
  };

  const getAvailableExercises = (part: string) => {
    const defaults = defaultExerciseDatabase[part] || [];
    const customs = customExerciseDB[part] || [];
    return [...defaults, ...customs];
  };

  const handleAddWeeklyWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !activePlan || !newWeeklyWeight) return;

    const weightVal = parseFloat(newWeeklyWeight);

    // Limit weight difference to no more than 10kg
    const lastWeight = weeklyWeights.length > 0 ? weeklyWeights[weeklyWeights.length - 1].weight : startWeight;
    const weightChange = Math.abs(weightVal - lastWeight);
    if (weightChange > 10.0) {
      alert("Weight difference cannot be more than 10kg in a single week. This is not healthy!");
      return;
    }

    const newEntry = { date: new Date().toISOString(), weight: weightVal };
    const updatedWeights = [...weeklyWeights, newEntry];
    localStorage.setItem(`${userEmail}_${activePlan}_weeklyWeights`, JSON.stringify(updatedWeights));
    setWeeklyWeights(updatedWeights);

    // Calculate expected weight today to evaluate recommendation
    const startObj = planStartDate ? new Date(planStartDate) : new Date();
    const diffTime = Math.abs(new Date().getTime() - startObj.getTime());
    const daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = planDuration * 30 || 90;
    const expectedWeight = startWeight - ((startWeight - goalWeight) * (daysSinceStart / totalDays));
    const diff = weightVal - expectedWeight;
    const absDiff = Math.abs(diff);

    const isLosing = startWeight > goalWeight;
    const isAhead = isLosing ? diff < 0 : diff > 0;

    if (absDiff >= 2.0) {
      setLoadingRecommendation(true);
      setAiRecommendation(null);
      setShowRecommendationDetails(true);

      const proposedCalories = isAhead ? Math.max(1200, Math.round(targetCalories - 200)) : Math.round(targetCalories + 200);
      const proposedProtein = Math.round(weightVal * 2.2); // 1g/lb is approx 2.2g/kg
      const proposedFats = Math.round(goalWeightLbs * 0.4);
      const proposedSleep = Math.min(10, Math.max(6, sleepTarget + 1));
      const proposedWater = Math.round(targetHydration + 250);

      const aiMsg = isAhead
        ? `Ahead of schedule by ${absDiff.toFixed(1)}kg!\n\nGreat gains! Make sure protein intake is high (1g/lb) and progressive overload is driving the growth — not just calorie excess.`
        : `Behind schedule by ${absDiff.toFixed(1)}kg.\n\nIncrease your caloric surplus by 100–200 kcal/day and focus on progressive overload.`;

      try {
        const response = await fetch("/api/gemini/analyze-routine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activePlanName: activePlan,
            startWeight,
            goalWeight,
            planDuration,
            targetCalories: proposedCalories,
            targetProtein: proposedProtein,
            targetFats: proposedFats,
            goal,
            activityLevel,
            sleepTarget: proposedSleep,
            userProfile: {
              gymTiming: "06:00 PM",
              wakeTime: "06:30 AM",
              sleepTime: "10:30 PM",
              dietPreference: "Flexible",
              experienceLevel: "Intermediate",
              medicalContext: "None",
              injuries: isAhead
                ? `Ahead of schedule by ${absDiff.toFixed(1)}kg! Great gains! Make sure protein intake is high (1g/lb) and progressive overload is driving the growth — not just calorie excess.`
                : `Behind schedule by ${absDiff.toFixed(1)}kg. Increase your caloric surplus by 100–200 kcal/day and focus on progressive overload.`
            }
          }),
        });

        if (response.ok) {
          const parsed = await response.json();
          setAiRecommendation({
            onTrack: false,
            diff: diff,
            absDiff: absDiff,
            weight: weightVal,
            message: aiMsg,
            targets: {
              calories: proposedCalories,
              protein: proposedProtein,
              fats: proposedFats,
              sleep: proposedSleep,
              water: proposedWater
            },
            timetable: parsed.timetable || [],
            tips: parsed.tips || []
          });
        } else {
          throw new Error("API call failed");
        }
      } catch (err) {
        // Offline / Fallback recommendation
        setAiRecommendation({
          onTrack: false,
          diff: diff,
          absDiff: absDiff,
          weight: weightVal,
          message: aiMsg,
          targets: {
            calories: proposedCalories,
            protein: proposedProtein,
            fats: proposedFats,
            sleep: proposedSleep,
            water: proposedWater
          },
          timetable: [
            { time: "07:00 AM", activity: "Morning Hydration & Light Walk", description: "Drink 500ml water immediately upon waking. Walk briskly for 15-20 mins." },
            { time: "08:30 AM", activity: "High-Protein Breakfast", description: `Aim for ${Math.round(proposedProtein / 4)}g of protein (e.g., egg whites, protein shake, oats).` },
            { time: "01:00 PM", activity: "Balanced Fuel Lunch", description: "Lean chicken breast/tofu with sweet potato and green veggies." },
            { time: "05:30 PM", activity: "Pre-Workout Snack", description: "Rice cakes with peanut butter or a banana." },
            { time: "06:30 PM", activity: "Progressive Overload Workout", description: "Focus on heavy compound lifts. Log all sets and reps in the gym app." },
            { time: "08:30 PM", activity: "Post-Workout Recovery Meal", description: "Steak/salmon with jasmine rice. Replenish nutrients." },
            { time: "10:00 PM", activity: "Wind Down & Sleep Prep", description: "No screens. Rest to hit the target sleep hours." }
          ],
          tips: [
            `Target a protein intake of ${proposedProtein}g to support ${isAhead ? "muscle growth" : "muscle retention"}.`,
            `Keep daily calories at ${proposedCalories} kcal to optimize weight adjustment.`,
            `Ensure you sleep at least ${proposedSleep} hours for optimal muscle recovery.`,
            `Drink at least ${proposedWater}ml water daily to stay perfectly hydrated.`
          ]
        });
      } finally {
        setLoadingRecommendation(false);
      }
    } else {
      setAiRecommendation({
        onTrack: true,
        message: "No recommendations needed. Keep pushing like that!"
      });
    }

    alert(`Weight Logged Successfully! Today: ${weightVal} kg`);
    setNewWeeklyWeight("");
  };

  const handleConfirmAndApply = () => {
    if (!userEmail || !activePlan || !aiRecommendation?.targets) return;

    // Save proposed custom targets
    localStorage.setItem(
      `${userEmail}_${activePlan}_customTargets`,
      JSON.stringify(aiRecommendation.targets)
    );

    // Save proposed routine timetable and tips
    const newRoutine = {
      timetable: aiRecommendation.timetable,
      tips: aiRecommendation.tips
    };
    localStorage.setItem(
      `${userEmail}_${activePlan}_aiRoutine`,
      JSON.stringify(newRoutine)
    );

    alert("AI Recommended Daily Routine applied successfully! Your daily targets and schedule have been updated.");
    setAiRecommendation(null);
    setShowRecommendationDetails(false);
    window.location.reload(); // Reload to refresh all targets and score immediately
  };

  const handleDrinkWater = (amount: number) => {
    if (!userEmail || !activePlan) return;
    const newAmount = loggedWater + amount;
    setLoggedWater(newAmount);
    const todayStr = new Date().toDateString();
    localStorage.setItem(`${userEmail}_${activePlan}_water_${todayStr}`, newAmount.toString());
  };

  // --- Dates & Filtering ---
  const todayObj = new Date();
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const todayStr = todayObj.toISOString().split('T')[0];
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  const todayMeals = loggedMeals.filter(m => m.date.startsWith(todayStr));

  // Calculate specific macronutrients
  const currentCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const currentProtein = todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const currentFats = todayMeals.reduce((acc, m) => acc + (m.fat || 0), 0);

  const currentPlan = savedPlans.find((p: any) => p.name === activePlan);
  const goal = currentPlan?.goal || "maintenance";
  const activityLevel = currentPlan?.activityLevel || "moderate";

  // --- Complex Target Calculations ---
  const goalWeightLbs = goalWeight * 2.20462;
  const maintenanceTDEE = goalWeightLbs * 15;
  const dailyCalorieAdjustment = ((goalWeight - startWeight) * 2.20462 * 3500) / (planDuration * 30);
  let targetCalories = Math.round(maintenanceTDEE + dailyCalorieAdjustment);
  if (targetCalories < 1200 && startWeight > goalWeight) targetCalories = 1200; // Safety floor
  if (customTargets?.calories) {
    targetCalories = customTargets.calories;
  }

  const currentActualWeight = weeklyWeights.length > 0 ? weeklyWeights[weeklyWeights.length - 1].weight : startWeight;
  let targetProtein = Math.round(currentActualWeight * 1.8);
  if (customTargets?.protein) {
    targetProtein = customTargets.protein;
  }
  let targetFats = Math.round(goalWeightLbs * 0.4);
  if (customTargets?.fats) {
    targetFats = customTargets.fats;
  }

  // Dynamic scientific water target formula
  const baseHydration = currentActualWeight * 35;
  const gainGoalHydration = /muscle|bulk|gain/i.test(goal);
  const goalBonusHydration = gainGoalHydration ? 500 : 0;
  const hydrationMultipliers: Record<string, number> = { sedentary: 1.0, light: 1.1, moderate: 1.2, active: 1.3 };
  const hydrationMultiplier = hydrationMultipliers[activityLevel?.toLowerCase()] ?? 1.2;
  let targetHydration = Math.round((baseHydration + goalBonusHydration) * hydrationMultiplier);
  if (customTargets?.water) {
    targetHydration = customTargets.water;
  }

  let sleepTargetVal = sleepTarget;
  if (customTargets?.sleep) {
    sleepTargetVal = customTargets.sleep;
  }

  // --- Dynamic Scores for 6-metric Grid using Goldilocks Zone Penalty Rule ---
  const warningsList: { metric: string; msg: string; severity: "warning" | "penalty" }[] = [];

  // Sleep warning/penalty logic:
  let sleepHoursDeduction = 0;
  let sleepQualityDeduction = 0;
  const todaySleep = sleepLogs[todayStr];
  const currentSleep = todaySleep ? todaySleep.hours : 0;
  const currentSleepQuality = todaySleep ? todaySleep.quality : "Good";

  if (!todaySleep) {
    warningsList.push({ metric: "Sleep", msg: "No sleep logged for today yet.", severity: "warning" });
    sleepHoursDeduction = 30; // maximum deduction if not logged
  } else {
    const sleepDiff = Math.abs(currentSleep - sleepTargetVal);
    if (sleepDiff > 0 && sleepDiff <= 1.5) {
      warningsList.push({ metric: "Sleep", msg: `Sleep hours off by ${sleepDiff.toFixed(1)}h (within +1.5h warning zone). No hour penalty applied.`, severity: "warning" });
    } else if (sleepDiff > 1.5) {
      sleepHoursDeduction = (sleepDiff - 1.5) * 4;
      warningsList.push({ metric: "Sleep", msg: `Sleep hours off by ${sleepDiff.toFixed(1)}h. Hour penalty applied.`, severity: "penalty" });
    }

    // Quality check
    if (currentSleepQuality === "Excellent") {
      sleepQualityDeduction = 0;
    } else if (currentSleepQuality === "Good") {
      sleepQualityDeduction = 1.5;
      warningsList.push({ metric: "Sleep Quality", msg: "Sleep quality rated Good (+1.5 warning deduction).", severity: "warning" });
    } else if (currentSleepQuality === "Fair") {
      sleepQualityDeduction = 5;
      warningsList.push({ metric: "Sleep Quality", msg: "Sleep quality rated Fair (-5 penalty points).", severity: "penalty" });
    } else if (currentSleepQuality === "Poor") {
      sleepQualityDeduction = 10;
      warningsList.push({ metric: "Sleep Quality", msg: "Sleep quality rated Poor (-10 penalty points).", severity: "penalty" });
    }
  }
  const sleepPoints = Math.max(0, 30 - (sleepHoursDeduction + sleepQualityDeduction));
  const sleepScore = (sleepPoints / 30) * 100;

  // Calories warning/penalty logic:
  let calDeduction = 0;
  const calDiff = Math.abs(currentCalories - targetCalories);
  if (calDiff > 0 && calDiff <= 150) {
    warningsList.push({ metric: "Calories", msg: `Calories off by ${calDiff} kcal (within ±150 kcal warning zone). No penalty applied.`, severity: "warning" });
  } else if (calDiff > 150) {
    calDeduction = ((calDiff - 150) / 100) * 2;
    warningsList.push({ metric: "Calories", msg: `Calories off by ${calDiff} kcal. Penalty applied.`, severity: "penalty" });
  }
  const calPoints = Math.max(0, 25 - calDeduction);
  const calScore = (calPoints / 25) * 100;

  // Protein warning/penalty logic:
  let protDeduction = 0;
  const protDiff = Math.abs(currentProtein - targetProtein);
  if (protDiff > 0 && protDiff <= 10) {
    warningsList.push({ metric: "Protein", msg: `Protein off by ${protDiff}g (within ±10g warning zone). No penalty applied.`, severity: "warning" });
  } else if (protDiff > 10) {
    protDeduction = ((protDiff - 10) / 5) * 1.5;
    warningsList.push({ metric: "Protein", msg: `Protein off by ${protDiff}g. Penalty applied.`, severity: "penalty" });
  }
  const protPoints = Math.max(0, 15 - protDeduction);
  const protScore = (protPoints / 15) * 100;

  // Workout sets warning/penalty logic:
  let workoutDeduction = 0;
  const setsLoggedToday = exerciseLogs.filter(l => l.date === todayStr).length;
  const workoutDiff = Math.abs(setsLoggedToday - 6);
  if (workoutDiff > 0 && workoutDiff <= 4) {
    warningsList.push({ metric: "Workout Sets", msg: `Workout sets off by ${workoutDiff} (within ±4 sets warning zone). No penalty applied.`, severity: "warning" });
  } else if (workoutDiff > 4) {
    workoutDeduction = (workoutDiff - 4) * 3;
    warningsList.push({ metric: "Workout Sets", msg: `Workout sets off by ${workoutDiff} sets. Penalty applied.`, severity: "penalty" });
  }
  const workoutPoints = Math.max(0, 12 - workoutDeduction);
  const workoutScore = (workoutPoints / 12) * 100;

  // Hydration warning/penalty logic:
  let hydDeduction = 0;
  const hydDiff = Math.abs(loggedWater - targetHydration);
  if (hydDiff > 0 && hydDiff <= 500) {
    warningsList.push({ metric: "Hydration", msg: `Hydration off by ${hydDiff}ml (within ±500ml warning zone). No penalty applied.`, severity: "warning" });
  } else if (hydDiff > 500) {
    hydDeduction = ((hydDiff - 500) / 500) * 1;
    warningsList.push({ metric: "Hydration", msg: `Hydration off by ${hydDiff}ml. Penalty applied.`, severity: "penalty" });
  }
  const hydPoints = Math.max(0, 10 - hydDeduction);
  const hydScore = (hydPoints / 10) * 100;

  // Fats warning/penalty logic:
  let fatDeduction = 0;
  const fatDiff = Math.abs(currentFats - targetFats);
  if (fatDiff > 0 && fatDiff <= 30) {
    warningsList.push({ metric: "Fats", msg: `Fats off by ${fatDiff}g (within ±30g warning zone). No penalty applied.`, severity: "warning" });
  } else if (fatDiff > 30) {
    fatDeduction = ((fatDiff - 30) / 5) * 1;
    warningsList.push({ metric: "Fats", msg: `Fats off by ${fatDiff}g. Penalty applied.`, severity: "penalty" });
  }
  const fatPoints = Math.max(0, 8 - fatDeduction);
  const fatScore = (fatPoints / 8) * 100;

  // Overall Score (Tally out of exactly 100 points)
  const overallProgress = Math.round(
    (sleepScore * 0.30) +
    (calScore * 0.25) +
    (protScore * 0.15) +
    (workoutScore * 0.12) +
    (hydScore * 0.10) +
    (fatScore * 0.08)
  );

  const sleepDeducted = Math.max(0, Math.round((sleepHoursDeduction + sleepQualityDeduction) * 10) / 10);
  const calDeducted = Math.max(0, Math.round(calDeduction * 10) / 10);
  const protDeducted = Math.max(0, Math.round(protDeduction * 10) / 10);
  const workoutDeducted = Math.max(0, Math.round(workoutDeduction * 10) / 10);
  const hydDeducted = Math.max(0, Math.round(hydDeduction * 10) / 10);
  const fatDeducted = Math.max(0, Math.round(fatDeduction * 10) / 10);

  // --- Weigh-in Logic & Status ---
  let daysSinceStart = 0;
  let nextWeighInDays = 7;
  let showWeighInForm = false;

  if (planStartDate) {
    const startObj = new Date(planStartDate);
    const diffTime = Math.abs(todayObj.getTime() - startObj.getTime());
    daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const lastWeighInDate = weeklyWeights.length > 0 ? new Date(weeklyWeights[weeklyWeights.length - 1].date) : startObj;
    const intervalMs = TEST_MODE ? 3 * 1000 : 7 * 24 * 60 * 60 * 1000; // 3 seconds or 7 days
    const diffSinceLastMs = Math.abs(todayObj.getTime() - lastWeighInDate.getTime());

    if (diffSinceLastMs >= intervalMs) {
      showWeighInForm = true;
    } else {
      // Show remaining time until next weigh‑in (seconds in test mode, days otherwise)
      const divisor = TEST_MODE ? 1000 : 1000 * 60 * 60 * 24;
      const remainingUnits = Math.ceil((intervalMs - diffSinceLastMs) / divisor);
      nextWeighInDays = remainingUnits;
    }
  }

  const totalDays = planDuration * 30;
  const expectedWeight = startWeight - ((startWeight - goalWeight) * (daysSinceStart / totalDays));
  const weightDiffFromExpected = currentActualWeight - expectedWeight;
  let progressStatus = "On proper road (±1kg)";
  let statusColor = "text-green-500";

  const isLosing = startWeight > goalWeight;
  if (isLosing) {
    if (weightDiffFromExpected > 1) {
      progressStatus = `Behind schedule (+${weightDiffFromExpected.toFixed(1)}kg)`;
      statusColor = "text-red-500";
    } else if (weightDiffFromExpected < -1) {
      progressStatus = `Ahead of schedule! (${Math.abs(weightDiffFromExpected).toFixed(1)}kg ahead)`;
      statusColor = "text-blue-500";
    }
  } else {
    // Gaining
    if (weightDiffFromExpected < -1) {
      progressStatus = `Behind schedule (${Math.abs(weightDiffFromExpected).toFixed(1)}kg)`;
      statusColor = "text-red-500";
    } else if (weightDiffFromExpected > 1) {
      progressStatus = `Ahead of schedule! (+${weightDiffFromExpected.toFixed(1)}kg ahead)`;
      statusColor = "text-blue-500";
    }
  }

  // --- Weight Progress Alert/Suggestion ---
  let weightAlertType: 'good' | 'behind' | 'fast' | 'none' = 'none';
  let weightAlertMsg = '';
  let weightSuggestion = '';
  if (weeklyWeights.length > 0) {
    const isLosing = startWeight > goalWeight;
    if (Math.abs(weightDiffFromExpected) <= 1) {
      weightAlertType = 'good';
      weightAlertMsg = 'On track! Your weight is progressing exactly as planned.';
      weightSuggestion = 'Keep up your current routine. Consistency is key!';
    } else if ((isLosing && weightDiffFromExpected > 1) || (!isLosing && weightDiffFromExpected < -1)) {
      weightAlertType = 'behind';
      weightAlertMsg = `Behind schedule by ${Math.abs(weightDiffFromExpected).toFixed(1)}kg.`;
      weightSuggestion = isLosing
        ? 'Try a mild calorie cut of 100–200 kcal/day and add 1 extra cardio session per week.'
        : 'Increase your caloric surplus by 100–200 kcal/day and focus on progressive overload.';
    } else {
      weightAlertType = 'fast';
      weightAlertMsg = `Ahead of schedule by ${Math.abs(weightDiffFromExpected).toFixed(1)}kg!`;
      weightSuggestion = isLosing
        ? 'You\'re losing weight fast. Consider adding resistance training to preserve muscle and improve body composition instead of just cutting calories.'
        : 'Great gains! Make sure protein intake is high (1g/lb) and progressive overload is driving the growth — not just calorie excess.';
    }
  }
  const chartDates: string[] = [];
  const targetWeight: number[] = [];
  const actualWeight: (number | null)[] = [];
  const weightDiff = startWeight - goalWeight;

  for (let i = 0; i <= totalDays; i++) {
    chartDates.push(`Day ${i}`);
    targetWeight.push(startWeight - (weightDiff * (i / totalDays)));

    let logForDay = null;
    if (TEST_MODE) {
      if (i % 7 === 0) {
        const idx = i / 7;
        if (idx < weeklyWeights.length) {
          logForDay = weeklyWeights[idx].weight;
        }
      }
    } else {
      if (weeklyWeights.length > 0) {
        const startDate = new Date(weeklyWeights[0].date);
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + i);

        const match = weeklyWeights.find(w => {
          const d = new Date(w.date);
          return d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
        });
        if (match) logForDay = match.weight;
      }
    }

    if (i === 0 && !logForDay) {
      logForDay = startWeight;
    }
    actualWeight.push(logForDay);
  }

  const isWithinGoal = Math.abs(currentActualWeight - goalWeight) <= 2.5;

  const requiredLogsCount = Math.ceil(totalDays / 7) + 1;
  const planFinished = TEST_MODE ? weeklyWeights.length >= requiredLogsCount : daysSinceStart >= totalDays;

  // Set visual logs filtering — group by exercise
  const targetSetDateStr = setViewMode === "Today" ? todayStr : yesterdayStr;
  const rawDisplayedSets = exerciseLogs.filter(l => l.date.startsWith(targetSetDateStr));

  // Group by bodyPart + exercise
  const groupedSetsMap: { [key: string]: { bodyPart: string; exercise: string; sets: any[] } } = {};
  rawDisplayedSets.forEach(log => {
    const key = `${log.bodyPart}_${log.exercise}`;
    if (!groupedSetsMap[key]) {
      groupedSetsMap[key] = { bodyPart: log.bodyPart, exercise: log.exercise, sets: [] };
    }
    groupedSetsMap[key].sets.push(log);
  });
  const displayedSets = Object.values(groupedSetsMap);

  // Exercise Chart Filter
  const filteredLogs = exerciseLogs.filter(l => l.exercise === selectedExercise);
  const dates = filteredLogs.map(l => new Date(l.date).toLocaleDateString());
  const oneRMs = filteredLogs.map(l => l.oneRM);
  const current1RM = oneRMs.length > 0 ? oneRMs[oneRMs.length - 1] : null;
  const trackingType = getExerciseTrackingType(selectedExercise, selectedBodyPart);

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6 pt-24 w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back, {userName}!</h1>
          <p className="text-gray-500 mt-1">Track your daily progress and hit your goals.</p>
        </div>

        {activePlan && (
          <div className="flex gap-3 items-center">
            <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-blue-100">
              <Flame className="text-blue-500 animate-pulse" size={20} />
              <span className="font-bold text-blue-500">{activePlan}</span>
            </div>

            <div className="relative">
              <select
                value={activePlan || ""}
                onChange={handlePlanChange}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 text-gray-700 shadow-sm appearance-none pr-10"
              >
                {savedPlans.map(plan => <option key={plan.name} value={plan.name}>{plan.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        )}
      </header>

      {!activePlan ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-50 text-center space-y-6 w-full">
          <div className="flex justify-center">
            <div className="bg-blue-50 p-6 rounded-full">
              <Target className="text-blue-500" size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No Active Plan</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            You haven't started a fitness plan yet. Start a plan to track your diet, exercise, and progress.
          </p>
          <Link href="/plans">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors flex items-center gap-2 mx-auto mt-4 shadow-sm">
              <Plus size={20} /> Start a Plan Now
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {planFinished && (
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 rounded-3xl text-white shadow-xl border border-blue-400 flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse-slow">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                  <Trophy className="text-yellow-300 animate-bounce" size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Incredible Achievement! Plan Completed! 🏆</h3>
                  <p className="text-sm text-blue-100 mt-1">
                    You have logged all weeks and achieved a weight of {currentActualWeight.toFixed(2)}kg ({isWithinGoal ? "Within targeted range!" : "Dedicated run!"}).
                  </p>
                </div>
              </div>
              <Link href="/completed-plan">
                <button className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0">
                  <Sparkles size={16} /> View Journey Report Card & AI Story
                </button>
              </Link>
            </div>
          )}

          {/* Deep Overall Progress Card (Daily Score) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 w-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Algorithmic Progress Depth</h2>
                <p className={`text-sm font-medium flex items-center gap-1 mt-1 ${statusColor}`}>
                  <AlertCircle size={14} /> {progressStatus}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-blue-500">{overallProgress}%</span>
                <p className="text-xs text-gray-500 mt-1">Overall Daily Score</p>
              </div>
            </div>

            <ProgressBar label="" progress={overallProgress} colorClass="bg-gradient-to-r from-blue-400 to-blue-600" showText={false} />

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 border-t border-gray-50 pt-4">
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Moon size={12} /> Sleep (30%)</span>
                <p className="font-bold text-gray-900 mt-1">{currentSleep} / {sleepTarget}h</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Coffee size={12} /> Calories (25%)</span>
                <p className="font-bold text-gray-900 mt-1">{currentCalories} / {targetCalories}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Droplets size={12} /> Protein (15%)</span>
                <p className="font-bold text-gray-900 mt-1">{currentProtein} / {targetProtein}g</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Dumbbell size={12} /> Workout (12%)</span>
                <p className="font-bold text-gray-900 mt-1">{setsLoggedToday} / 6 sets</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Droplets size={12} /> Hydration (10%)</span>
                <p className="font-bold text-gray-900 mt-1">{(loggedWater / 1000).toFixed(1)} / {(targetHydration / 1000).toFixed(1)}L</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Coffee size={12} /> Fats (8%)</span>
                <p className="font-bold text-gray-900 mt-1">{currentFats} / {targetFats}g</p>
              </div>
            </div>

            {/* Goldilocks ZONE PENALTY BREAKDOWN */}
            <div className="mt-6 border-t border-gray-50 pt-4 flex flex-col items-center">
              <button
                onClick={() => setShowPenaltyDetails(!showPenaltyDetails)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-4 py-2 rounded-2xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                {showPenaltyDetails ? "Hide Penalty Breakdown 🏛️" : "View Penalty Breakdown 🔍"}
              </button>

              {showPenaltyDetails && (
                <div className="w-full mt-4 bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-4 text-left animate-fadeIn">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 text-sm">Symmetric Penalty Breakdown (Goldilocks Rule)</h3>
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-100">Max 100 points</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Both going <strong>under</strong> or <strong>over</strong> your daily targets incurs a penalty to ensure optimal recovery and muscle growth while avoiding overtraining or excessive surplus.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {/* Sleep */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-purple-50 p-2 rounded-xl text-purple-500">
                          <Moon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Sleep (Max 30pts)</p>
                          <p className="text-[11px] text-gray-500">Target: {sleepTarget}h | Got: {currentSleep}h</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${sleepDeducted > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {sleepDeducted > 0 ? `-${sleepDeducted} pts` : "Perfect!"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Score: {Math.round(sleepPoints)} / 30</p>
                      </div>
                    </div>

                    {/* Calories */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-orange-50 p-2 rounded-xl text-orange-500">
                          <Coffee size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Calories (Max 25pts)</p>
                          <p className="text-[11px] text-gray-500">Target: {targetCalories} | Got: {currentCalories}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${calDeducted > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {calDeducted > 0 ? `-${calDeducted} pts` : "Perfect!"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Score: {Math.round(calPoints)} / 25</p>
                      </div>
                    </div>

                    {/* Protein */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
                          <Droplets size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Protein (Max 15pts)</p>
                          <p className="text-[11px] text-gray-500">Target: {targetProtein}g | Got: {currentProtein}g</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${protDeducted > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {protDeducted > 0 ? `-${protDeducted} pts` : "Perfect!"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Score: {Math.round(protPoints)} / 15</p>
                      </div>
                    </div>

                    {/* Workout */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-green-50 p-2 rounded-xl text-green-500">
                          <Dumbbell size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Workout (Max 12pts)</p>
                          <p className="text-[11px] text-gray-500">Target: 6 sets | Got: {setsLoggedToday} sets</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${workoutDeducted > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {workoutDeducted > 0 ? `-${workoutDeducted} pts` : "Perfect!"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Score: {Math.round(workoutPoints)} / 12</p>
                      </div>
                    </div>

                    {/* Hydration */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-cyan-50 p-2 rounded-xl text-cyan-500">
                          <Droplets size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Hydration (Max 10pts)</p>
                          <p className="text-[11px] text-gray-500">Target: {(targetHydration / 1000).toFixed(1)}L | Got: {(loggedWater / 1000).toFixed(1)}L</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${hydDeducted > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {hydDeducted > 0 ? `-${hydDeducted} pts` : "Perfect!"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Score: {Math.round(hydPoints)} / 10</p>
                      </div>
                    </div>

                    {/* Fats */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-rose-50 p-2 rounded-xl text-rose-500">
                          <Coffee size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Fats (Max 8pts)</p>
                          <p className="text-[11px] text-gray-500">Target: {targetFats}g | Got: {currentFats}g</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${fatDeducted > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {fatDeducted > 0 ? `-${fatDeducted} pts` : "Perfect!"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Score: {Math.round(fatPoints)} / 8</p>
                      </div>
                    </div>
                  </div>

                  {/* Warnings list nested inside */}
                  {warningsList.length > 0 && (
                    <div className="mt-4 border-t border-gray-200/50 pt-4 space-y-2">
                      <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle size={14} /> Active Warnings & Penalties
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {warningsList.map((warn, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                              warn.severity === "penalty"
                                ? "bg-red-50/75 border-red-100/70 text-red-700"
                                : "bg-amber-50/75 border-amber-100/70 text-amber-700"
                            }`}
                          >
                            <span className="font-bold uppercase tracking-wide text-[9px] bg-white px-1.5 py-0.5 rounded shadow-xs shrink-0">
                              {warn.metric}
                            </span>
                            <span className="font-medium">{warn.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Weight Progress Alert/Suggestion Banner */}
          {weightAlertType !== 'none' && (
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-start md:items-center w-full ${weightAlertType === 'good' ? 'bg-green-50 border-green-100' :
              weightAlertType === 'behind' ? 'bg-red-50 border-red-100' :
                'bg-blue-50 border-blue-100'
              }`}>
              <div className={`text-2xl ${weightAlertType === 'good' ? '🟢' : weightAlertType === 'behind' ? '🔴' : '🚀'}`}>
                {weightAlertType === 'good' ? '✅' : weightAlertType === 'behind' ? '⚠️' : '🚀'}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${weightAlertType === 'good' ? 'text-green-700' :
                  weightAlertType === 'behind' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>{weightAlertMsg}</p>
                <p className="text-sm text-gray-600 mt-0.5">{weightSuggestion}</p>
              </div>
            </div>
          )}

          {/* Grid Style Topic Heading UI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Detailed Diet Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <h3 className="text-lg font-semibold text-blue-500 mb-4">Daily Diet Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Calories</span>
                    <span className="font-medium text-gray-900">{currentCalories} / {targetCalories} kcal</span>
                  </div>
                  <ProgressBar label="" progress={calScore} colorClass="bg-blue-500" showText={false} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Protein</span>
                    <span className="font-medium text-gray-900">{currentProtein} / {targetProtein} g</span>
                  </div>
                  <ProgressBar label="" progress={protScore} colorClass="bg-green-500" showText={false} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Fats</span>
                    <span className="font-medium text-gray-900">{currentFats} / {targetFats} g</span>
                  </div>
                  <ProgressBar label="" progress={fatScore} colorClass="bg-yellow-500" showText={false} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Hydration (ml)</span>
                    <span className="font-medium text-gray-900">{loggedWater} / {targetHydration}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleDrinkWater(250)} className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-md hover:bg-blue-100">+250ml</button>
                    <button onClick={() => handleDrinkWater(500)} className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-md hover:bg-blue-100">+500ml</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Exercise Overview */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-500">
                  {trackingType === "Time" ? "Exercise Max Time" : trackingType === "Reps" ? "Exercise Max Reps" : "Exercise 1RM"}
                </h3>
                <div className="flex gap-1">
                  <select
                    value={selectedBodyPart}
                    onChange={handleBodyPartChange}
                    className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-gray-700 max-w-[80px]"
                  >
                    {Object.keys(defaultExerciseDatabase).map(part => <option key={part} value={part}>{part}</option>)}
                  </select>
                  <select
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-gray-700 max-w-[100px]"
                  >
                    {getAvailableExercises(selectedBodyPart).map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-sm text-gray-500 mb-1">
                    {trackingType === "Time" ? "Max Hold Time" : trackingType === "Reps" ? "Max Reps" : "Current 1RM"} for {selectedExercise}
                  </span>
                  <span className="text-3xl font-extrabold text-gray-900">
                    {current1RM ? formatExerciseValue(current1RM, trackingType) : "--"}
                  </span>
                </div>
              </div>
            </div>

            {/* Weight Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <h3 className="text-lg font-semibold text-blue-500 mb-4">Weight Progress</h3>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Current</span>
                    <span className="font-medium text-gray-900">{currentActualWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Goal</span>
                    <span className="font-medium text-blue-500">{goalWeight.toFixed(2)} kg</span>
                  </div>
                  <ProgressBar label="" progress={workoutScore} colorClass="bg-blue-500" showText={false} />
                </div>

                {showWeighInForm ? (
                  <form onSubmit={handleAddWeeklyWeight} className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                    <input
                      type="number"
                      value={newWeeklyWeight}
                      onChange={(e) => setNewWeeklyWeight(e.target.value)}
                      placeholder="Log weight (kg)"
                      required
                      className="bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 text-sm flex-1 text-gray-900"
                    />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Log
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-50 text-center bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-600 block">Next weigh-in in</span>
                    <span className="text-2xl font-bold text-blue-500 block mt-1">{nextWeighInDays} <span className="text-sm font-medium">days</span></span>
                  </div>
                )}

                {loadingRecommendation && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-pulse">
                    <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-4 space-y-3">
                      <div className="h-4 bg-amber-200/50 rounded-md w-3/4"></div>
                      <div className="h-3 bg-amber-200/30 rounded-md w-5/6"></div>
                      <div className="h-3 bg-amber-200/30 rounded-md w-2/3"></div>
                      
                      <div className="space-y-2 pt-2">
                        <div className="h-3 bg-amber-200/40 rounded-md w-1/3"></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-10 bg-white/70 rounded-lg border border-amber-50"></div>
                          <div className="h-10 bg-white/70 rounded-lg border border-amber-50"></div>
                          <div className="h-10 bg-white/70 rounded-lg border border-amber-50"></div>
                          <div className="h-10 bg-white/70 rounded-lg border border-amber-50"></div>
                        </div>
                      </div>
                      <div className="h-9 bg-amber-300/40 rounded-xl w-full"></div>
                    </div>
                  </div>
                )}

                {aiRecommendation && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {aiRecommendation.onTrack ? (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                        <p className="text-sm font-bold text-green-800">{aiRecommendation.message}</p>
                        <button
                          onClick={() => setAiRecommendation(null)}
                          className="mt-2 text-xs font-semibold text-green-600 hover:text-green-800 underline cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowRecommendationDetails(!showRecommendationDetails)}
                          className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-amber-200 transition-colors cursor-pointer"
                        >
                          💡 View AI Recommended Daily Routine
                        </button>

                        {showRecommendationDetails && (
                          <div className="bg-amber-50/50 border border-amber-200/65 rounded-2xl p-4 space-y-4 animate-fadeIn">
                            <div className="bg-white p-3 rounded-xl border border-amber-200/50 shadow-xs">
                              <p className="text-xs font-bold text-amber-900 whitespace-pre-line leading-relaxed">
                                {aiRecommendation.message}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Proposed Daily Targets</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded-lg border border-amber-100/50">
                                  <span className="text-gray-500 block">Calories</span>
                                  <span className="font-bold text-amber-900">{aiRecommendation.targets.calories} kcal</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-amber-100/50">
                                  <span className="text-gray-500 block">Protein</span>
                                  <span className="font-bold text-amber-900">{aiRecommendation.targets.protein}g</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-amber-100/50">
                                  <span className="text-gray-500 block">Sleep Target</span>
                                  <span className="font-bold text-amber-900">{aiRecommendation.targets.sleep} hrs</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-amber-100/50">
                                  <span className="text-gray-500 block">Water Target</span>
                                  <span className="font-bold text-amber-900">{aiRecommendation.targets.water} ml</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-amber-200/40">
                              <h4 className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={13} className="text-amber-500 animate-pulse" /> Actionable AI Tips
                              </h4>
                              <div className="space-y-1.5">
                                {((aiRecommendation.tips && aiRecommendation.tips.length > 0) ? aiRecommendation.tips : [
                                  `Target a protein intake of ${aiRecommendation.targets.protein}g to support your muscles.`,
                                  `Keep daily calories at ${aiRecommendation.targets.calories} kcal to optimize weight adjustment.`,
                                  `Ensure you sleep at least ${aiRecommendation.targets.sleep} hours for optimal muscle recovery.`,
                                  `Drink at least ${aiRecommendation.targets.water}ml water daily to stay perfectly hydrated.`
                                ]).map((tip: string, idx: number) => (
                                  <div key={idx} className="bg-white/80 p-2.5 rounded-xl border border-amber-100/50 flex gap-2 items-start text-[11px] text-amber-950 font-medium">
                                    <span className="bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span className="leading-normal">{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={handleConfirmAndApply}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              ✅ Confirm & Apply to Daily Routine
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Logged Sets Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Logged Sets Overview</h3>
                <p className="text-sm text-gray-500 mt-1">Detailed visualization of your workouts.</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSetViewMode("Yesterday")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${setViewMode === "Yesterday" ? "bg-white text-blue-500 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Yesterday
                </button>
                <button
                  onClick={() => setSetViewMode("Today")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${setViewMode === "Today" ? "bg-white text-blue-500 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Today
                </button>
              </div>
            </div>

            {displayedSets.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <Dumbbell className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500">No sets logged for {setViewMode.toLowerCase()}.</p>
                <Link href="/visualise">
                  <span className="text-blue-500 font-medium text-sm mt-2 inline-block hover:underline cursor-pointer">Go log some exercises</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {displayedSets.map((group, idx) => {
                  const totalSets = group.sets.length;
                  const bestWeight = Math.max(...group.sets.map((s: any) => s.weight));
                  const totalReps = group.sets.reduce((acc: number, s: any) => acc + (s.reps || 0), 0);
                  return (
                    <div key={idx} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{group.bodyPart}</span>
                        <h4 className="text-lg font-bold text-gray-900 mt-1">{group.exercise}</h4>
                      </div>
                      <div className="mt-3 space-y-1">
                        {group.sets
                          .sort((a: any, b: any) => (a.setNumber || 1) - (b.setNumber || 1))
                          .map((set: any, sIdx: number) => {
                            const trackingType = getExerciseTrackingType(group.exercise, group.bodyPart);
                            return (
                              <div key={sIdx} className="flex justify-between text-xs bg-white rounded-lg px-2 py-1.5">
                                <span className="font-bold text-gray-900">Set {set.setNumber || sIdx + 1}</span>
                                {trackingType === "Time" ? (
                                  <span className="text-gray-600">{formatExerciseValue(set.reps, "Time")}</span>
                                ) : trackingType === "Reps" ? (
                                  <span className="text-gray-600">{formatExerciseValue(set.reps, "Reps")} {set.weight > 0 ? `(${set.weight}kg)` : ""}</span>
                                ) : (
                                  <span className="text-gray-600">{set.weight}kg × {set.reps} reps</span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Sets</p>
                          <p className="font-semibold text-gray-900">{totalSets}</p>
                        </div>
                        {getExerciseTrackingType(group.exercise, group.bodyPart) === "Time" ? (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Total Duration</p>
                            <p className="font-semibold text-gray-900">{formatExerciseValue(totalReps, "Time")}</p>
                          </div>
                        ) : getExerciseTrackingType(group.exercise, group.bodyPart) === "Reps" ? (
                          <>
                            <div>
                              <p className="text-xs text-gray-500">Total Reps</p>
                              <p className="font-semibold text-gray-900">{totalReps}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Best Weight</p>
                              <p className="font-semibold text-gray-900">{bestWeight > 0 ? `${bestWeight}kg` : "BW"}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-xs text-gray-500">Total Reps</p>
                              <p className="font-semibold text-gray-900">{totalReps}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Best Weight</p>
                              <p className="font-semibold text-gray-900">{bestWeight}kg</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Goal Trajectory Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <h3 className="text-lg font-semibold text-blue-500 mb-4">Goal Trajectory (Weight)</h3>
              <div className="h-64">
                <GoalChart dates={chartDates} actualData={actualWeight as number[]} targetData={targetWeight} label="Weight" />
              </div>
            </div>

            {/* Strength Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-500">Strength Trajectory</h3>
              </div>
              <div className="h-64">
                {dates.length > 0 ? (
                  <StrengthChart dates={dates} oneRMs={oneRMs} exerciseName={selectedExercise} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp size={32} className="mb-2 opacity-50" />
                    <p>No strength data for this exercise.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
