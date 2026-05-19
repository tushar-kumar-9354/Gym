"use client";

import React, { useState, useEffect } from "react";
import ProgressBar from "@/components/ProgressBar";
import { Flame, Plus, Target, ChevronDown, Scale, AlertCircle, TrendingUp, BarChart2, Coffee, Dumbbell, Droplets, ArrowRight } from "lucide-react";
import Link from "next/link";
import StrengthChart from "@/components/charts/StrengthChart";
import GoalChart from "@/components/charts/GoalChart";

export default function Dashboard() {
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

  // Current Plan Details
  const [startWeight, setStartWeight] = useState(80);
  const [goalWeight, setGoalWeight] = useState(75);
  const [planDuration, setPlanDuration] = useState(3); // in months
  const [planStartDate, setPlanStartDate] = useState<string | null>(null);

  // Form for weekly weight
  const [newWeeklyWeight, setNewWeeklyWeight] = useState("");

  // Set View Toggle
  const [setViewMode, setSetViewMode] = useState<"Today" | "Yesterday">("Today");

  const defaultExerciseDatabase: { [key: string]: string[] } = {
    Chest: ["Bench Press", "Incline Dumbbell Press", "Chest Flyes"],
    Back: ["Deadlift", "Pull-ups", "Bent Over Rows"],
    Legs: ["Squat", "Leg Press", "Calf Raises"],
    Shoulders: ["Overhead Press", "Lateral Raises"],
    Arms: ["Bicep Curls", "Tricep Pushdowns"],
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

        // Reset or fetch water
        const todayStr = new Date().toDateString();
        const storedWater = localStorage.getItem(`${email}_${plan}_water_${todayStr}`);
        if (storedWater) setLoggedWater(parseInt(storedWater));
        else setLoggedWater(0);
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

  const handleAddWeeklyWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !activePlan || !newWeeklyWeight) return;

    const weightVal = parseFloat(newWeeklyWeight);
    const newEntry = { date: new Date().toISOString(), weight: weightVal };
    const updatedWeights = [...weeklyWeights, newEntry];
    localStorage.setItem(`${userEmail}_${activePlan}_weeklyWeights`, JSON.stringify(updatedWeights));
    setWeeklyWeights(updatedWeights);
    alert(`Weight Logged Successfully! Today: ${weightVal} kg`);
    setNewWeeklyWeight("");
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

  // --- Complex Target Calculations ---
  const goalWeightLbs = goalWeight * 2.20462;
        
        
  const targetHydration = 3000; // 3 Liters

  // --- Dynamic Scores for 5-metric Grid ---
  // Calories (25%)
  const calRatio = targetCalories ? currentCalories / targetCalories : 0;
  const calScore = Math.min(calRatio * 100, 100);

  // Protein (25%)
  const protRatio = targetProtein ? currentProtein / targetProtein : 0;
  const protScore = Math.min(protRatio * 100, 100);

  // Fats (15%)
  const fatRatio = targetFats ? currentFats / targetFats : 0;
  const fatScore = Math.min(fatRatio * 100, 100);

  // Hydration (15%)
  const hydRatio = targetHydration ? loggedWater / targetHydration : 0;
  const hydScore = Math.min(hydRatio * 100, 100);

  // Workout (20%) - Based on current vs goal weight delta + exercise done today
  const currentActualWeight = weeklyWeights.length > 0 ? weeklyWeights[weeklyWeights.length - 1].weight : startWeight;
  const totalWeightDiffGoal = Math.abs(startWeight - goalWeight);
  const currentWeightDiff = Math.abs(startWeight - currentActualWeight);
  const weightProgressScore = totalWeightDiffGoal > 0 ? Math.min((currentWeightDiff / totalWeightDiffGoal) * 100, 100) : 0;
  // Check if any exercise logged today
  const hasExerciseToday = exerciseLogs.some(l => l.date === todayStr);
  const workoutScore = Math.min(weightProgressScore + (hasExerciseToday ? 25 : 0), 100);


  // Overall Score
  const overallProgress = Math.round(
    (calScore * 0.25) +
    (protScore * 0.25) +
    (fatScore * 0.15) +
    (hydScore * 0.15) +
    (workoutScore * 0.20)
  );

  // --- Weigh-in Logic & Status ---
  let daysSinceStart = 0;
  let nextWeighInDays = 7;
  let showWeighInForm = false;

  if (planStartDate) {
    const startObj = new Date(planStartDate);
    const diffTime = Math.abs(todayObj.getTime() - startObj.getTime());
    daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const lastWeighInDate = weeklyWeights.length > 0 ? new Date(weeklyWeights[weeklyWeights.length - 1].date) : startObj;
    // TEST MODE: use 20 seconds instead of 7 days
    const diffSinceLastMs = Math.abs(todayObj.getTime() - lastWeighInDate.getTime());
    // Use a 7‑day interval for weigh‑in logic
    const intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    if (diffSinceLastMs >= intervalMs) {
      showWeighInForm = true;
    } else {
      // Show remaining days until next weigh‑in
      const remainingDays = Math.ceil((intervalMs - diffSinceLastMs) / (1000 * 60 * 60 * 24));
      nextWeighInDays = remainingDays;
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

    if (i === 0 && !logForDay) {
      logForDay = startWeight;
    }
    actualWeight.push(logForDay);
  }

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

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 border-t border-gray-50 pt-4">
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Coffee size={12} /> Calories (25%)</span>
                <p className="font-bold text-gray-900 mt-1">{currentCalories} / {targetCalories}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Droplets size={12} /> Protein (25%)</span>
                <p className="font-bold text-gray-900 mt-1">{currentProtein} / {targetProtein}g</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Coffee size={12} /> Fats (15%)</span>
                <p className="font-bold text-gray-900 mt-1">{currentFats} / {targetFats}g</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Droplets size={12} /> Hydration (15%)</span>
                <p className="font-bold text-gray-900 mt-1">{Math.round(hydScore)}%</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Scale size={12} /> Workout (20%)</span>
                <p className="font-bold text-gray-900 mt-1">{Math.round(workoutScore)}%</p>
              </div>
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
                <h3 className="text-lg font-semibold text-blue-500">Exercise 1RM</h3>
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
                  <span className="text-sm text-gray-500 mb-1">Current 1RM for {selectedExercise}</span>
                  <span className="text-3xl font-extrabold text-gray-900">{current1RM ? `${current1RM} kg` : "--"}</span>
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
                    <span className="font-medium text-gray-900">{currentActualWeight} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Goal</span>
                    <span className="font-medium text-blue-500">{goalWeight} kg</span>
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
                          .map((set: any, sIdx: number) => (
                            <div key={sIdx} className="flex justify-between text-xs bg-white rounded-lg px-2 py-1.5">
                              <span className="font-bold text-gray-900">Set {set.setNumber || sIdx + 1}</span>
                              <span className="text-gray-600">{set.weight}kg × {set.reps} reps</span>
                            </div>
                          ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Sets</p>
                          <p className="font-semibold text-gray-900">{totalSets}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Reps</p>
                          <p className="font-semibold text-gray-900">{totalReps}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Best Weight</p>
                          <p className="font-semibold text-gray-900">{bestWeight}kg</p>
                        </div>
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
