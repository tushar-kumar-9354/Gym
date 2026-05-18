"use client";

import React, { useState, useEffect } from "react";
import ProgressBar from "@/components/ProgressBar";
import { Flame, Plus, Target, ChevronDown, Scale, AlertCircle, TrendingUp, BarChart2, Coffee, Dumbbell } from "lucide-react";
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
  const [weeklyWeights, setWeeklyWeights] = useState<{date: string, weight: number}[]>([]);
  
  // Current Plan Details
  const [startWeight, setStartWeight] = useState(80);
  const [goalWeight, setGoalWeight] = useState(75);
  const [planDuration, setPlanDuration] = useState(3); // in months

  // Form for weekly weight
  const [newWeeklyWeight, setNewWeeklyWeight] = useState("");
  
  // For dynamic timer check
  const [currentTime, setCurrentTime] = useState(Date.now());

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
        
        const logs = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
        setExerciseLogs(logs);

        const meals = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
        setLoggedMeals(meals);

        const weights = JSON.parse(localStorage.getItem(`${email}_${plan}_weeklyWeights`) || "[]");
        setWeeklyWeights(weights);
      }

      const savedCustomEx = JSON.parse(localStorage.getItem(`${email}_customExercises`) || "{}");
      setCustomExerciseDB(savedCustomEx);
    }

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planName = e.target.value;
    localStorage.setItem(`${userEmail}_activePlan`, planName);
    setActivePlan(planName);
    
    const currentPlan = savedPlans.find((p: any) => p.name === planName);
    if (currentPlan) {
      setStartWeight(currentPlan.weight);
      setGoalWeight(currentPlan.goalWeight);
      setPlanDuration(currentPlan.duration);
      
      const logs = JSON.parse(localStorage.getItem(`${userEmail}_${planName}_exerciseLogs`) || "[]");
      setExerciseLogs(logs);

      const meals = JSON.parse(localStorage.getItem(`${userEmail}_${planName}_loggedMeals`) || "[]");
      setLoggedMeals(meals);

      const weights = JSON.parse(localStorage.getItem(`${userEmail}_${planName}_weeklyWeights`) || "[]");
      setWeeklyWeights(weights);
    }
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
    if (weightVal > 150) {
      alert("Weight cannot be more than 150 kg!");
      return;
    }

    const lastWeight = weeklyWeights.length > 0 ? weeklyWeights[weeklyWeights.length - 1].weight : startWeight;

    const newEntry = {
      date: new Date().toISOString(),
      weight: weightVal,
    };

    const updatedWeights = [...weeklyWeights, newEntry];
    localStorage.setItem(`${userEmail}_${activePlan}_weeklyWeights`, JSON.stringify(updatedWeights));
    setWeeklyWeights(updatedWeights);
    
    alert(`Weight Logged Successfully!\nEarlier: ${lastWeight} kg\nToday: ${weightVal} kg`);
    setNewWeeklyWeight("");
  };

  // Filter logs for selected exercise
  const filteredLogs = exerciseLogs.filter(l => l.exercise === selectedExercise);
  const dates = filteredLogs.map(l => new Date(l.date).toLocaleDateString());
  const oneRMs = filteredLogs.map(l => l.oneRM);

  // Calculate today's totals
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = loggedMeals.filter(m => {
    const mDate = new Date(m.date).toISOString().split('T')[0];
    return mDate === today;
  });
  const currentCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const targetCalories = 2200;

  // Dynamic Goal Chart Data based on DAYS
  const totalDays = planDuration * 30;
  const chartDates: string[] = [];
  const targetWeight: number[] = [];
  const actualWeight: (number | null)[] = [];

  const weightDiff = startWeight - goalWeight;

  for (let i = 0; i <= totalDays; i++) {
    chartDates.push(`Day ${i}`);
    targetWeight.push(startWeight - (weightDiff * (i / totalDays)));
    
    if (i <= 10) {
      actualWeight.push(startWeight - (weightDiff * (i / totalDays) * 1.1) + (Math.random() * 0.2 - 0.1));
    } else {
      actualWeight.push(null);
    }
  }

  // --- COMPLEX SCORE ALGORITHM ---
  const exerciseDates = exerciseLogs.map(l => new Date(l.date).toISOString().split('T')[0]);
  const mealDates = loggedMeals.map(m => new Date(m.date).toISOString().split('T')[0]);
  const uniqueDays = new Set([...exerciseDates, ...mealDates]);
  const daysFollowed = uniqueDays.size;
  const daysLeft = Math.max(totalDays - daysFollowed, 0);
  const timeScore = Math.min((daysFollowed / totalDays) * 100, 100);

  const dietScore = Math.min((currentCalories / targetCalories) * 100, 100);

  const expectedExercises = daysFollowed * 3;
  const actualExercises = exerciseLogs.length;
  const exerciseScore = expectedExercises > 0 ? Math.min((actualExercises / expectedExercises) * 100, 100) : 0;

  const totalWeeks = planDuration * 4;
  const expectedWeeklyChange = (goalWeight - startWeight) / totalWeeks;
  const currentActualWeight = weeklyWeights.length > 0 ? weeklyWeights[weeklyWeights.length - 1].weight : startWeight;
  const totalActualChange = currentActualWeight - startWeight;
  const weeksPassed = Math.max(daysFollowed / 7, 1);
  const actualWeeklyChange = totalActualChange / weeksPassed;
  
  let weightScore = 0;
  if (expectedWeeklyChange !== 0) {
    const rateRatio = actualWeeklyChange / expectedWeeklyChange;
    weightScore = Math.max(0, 100 - Math.abs(1 - rateRatio) * 50);
  } else {
    weightScore = Math.max(100 - Math.abs(currentActualWeight - startWeight) * 10, 0);
  }

  let strengthScore = 0;
  if (oneRMs.length >= 2) {
    const start1RM = oneRMs[0];
    const latest1RM = oneRMs[oneRMs.length - 1];
    if (latest1RM > start1RM) {
      strengthScore = Math.min(((latest1RM - start1RM) / start1RM) * 500, 100);
    }
  }

  const overallProgress = Math.round(
    (timeScore * 0.15) + 
    (dietScore * 0.35) + 
    (exerciseScore * 0.20) + 
    (weightScore * 0.20) + 
    (strengthScore * 0.10)
  );

  const isLosing = startWeight > goalWeight;
  const lastTwoWeights = weeklyWeights.slice(-2);
  let progressStatus = "Not enough data (Log at least 2 entries)";
  let statusColor = "text-gray-500";

  if (lastTwoWeights.length === 2) {
    const diff = lastTwoWeights[1].weight - lastTwoWeights[0].weight;
    if (isLosing) {
      if (diff < 0) {
        progressStatus = `Progressing Well! Losing ${Math.abs(diff).toFixed(1)}kg this week.`;
        statusColor = "text-green-500";
      } else {
        progressStatus = `Stuck! Gained ${diff.toFixed(1)}kg this week.`;
        statusColor = "text-red-500";
      }
    } else {
      if (diff > 0) {
        progressStatus = `Progressing Well! Gaining ${diff.toFixed(1)}kg this week.`;
        statusColor = "text-green-500";
      } else {
        progressStatus = `Stuck! Lost ${Math.abs(diff).toFixed(1)}kg this week.`;
        statusColor = "text-red-500";
      }
    }
  }

  const todayObj = new Date();
  const isSunday = todayObj.getDay() === 0;
  const hasLoggedToday = weeklyWeights.some(w => {
    const wDate = new Date(w.date).toISOString().split('T')[0];
    return wDate === todayObj.toISOString().split('T')[0];
  });
  const needsReminder = isSunday && !hasLoggedToday;

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
          {/* Weekly Weight Reminder Card */}
          {needsReminder && (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-500">
                  <Scale size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Weekly Weight Reminder</h3>
                  <p className="text-sm text-gray-600">It's Sunday! Time to log your current weight to check your progress.</p>
                </div>
              </div>
              <form onSubmit={handleAddWeeklyWeight} className="flex gap-2 w-full md:w-auto">
                <input 
                  type="number" 
                  value={newWeeklyWeight}
                  onChange={(e) => setNewWeeklyWeight(e.target.value)}
                  placeholder="Current kg" 
                  required
                  className="bg-white border border-gray-100 rounded-2xl py-2 px-3 focus:outline-none focus:border-blue-500 text-sm flex-1 md:w-32 text-gray-900"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-2xl text-sm font-medium">
                  Log
                </button>
              </form>
            </div>
          )}

          {/* Deep Overall Progress Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 w-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Algorithmic Progress Depth</h2>
                <p className={`text-sm font-medium ${statusColor} flex items-center gap-1 mt-1`}>
                  <AlertCircle size={14} /> {progressStatus}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-blue-500">{overallProgress}%</span>
                <p className="text-xs text-gray-500 mt-1">{daysFollowed} days followed • {daysLeft} days left</p>
              </div>
            </div>

            <ProgressBar label="" progress={overallProgress} colorClass="bg-gradient-to-r from-blue-400 to-blue-600" showText={false} />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 border-t border-gray-50 pt-4">
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><BarChart2 size={12} /> Time (15%)</span>
                <p className="font-bold text-gray-900 mt-1">{Math.round(timeScore)}%</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Coffee size={12} /> Diet (35%)</span>
                <p className="font-bold text-gray-900 mt-1">{Math.round(dietScore)}%</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Dumbbell size={12} /> Exercise (20%)</span>
                <p className="font-bold text-gray-900 mt-1">{Math.round(exerciseScore)}%</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><Scale size={12} /> Weight (20%)</span>
                <p className="font-bold text-gray-900 mt-1">{Math.round(weightScore)}%</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 flex items-center justify-center gap-1"><TrendingUp size={12} /> Strength (10%)</span>
                <p className="font-bold text-gray-900 mt-1">{Math.round(strengthScore)}%</p>
              </div>
            </div>
          </div>

          {/* Grid Style Topic Heading UI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Diet Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <h3 className="text-lg font-semibold text-blue-500 mb-4">Daily Diet</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Calories</span>
                  <span className="font-medium text-gray-900">{currentCalories} / {targetCalories} kcal</span>
                </div>
                <ProgressBar label="" progress={dietScore} colorClass="bg-blue-500" showText={false} />
              </div>
            </div>

            {/* Exercise Card with Two Dropdowns */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-500">Daily Exercise</h3>
                <div className="flex gap-1">
                  <select 
                    value={selectedBodyPart}
                    onChange={handleBodyPartChange}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-gray-700 max-w-[80px]"
                  >
                    {Object.keys(defaultExerciseDatabase).map(part => <option key={part} value={part}>{part}</option>)}
                  </select>
                  <select 
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-gray-700 max-w-[100px]"
                  >
                    {getAvailableExercises(selectedBodyPart).map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current 1RM</span>
                  <span className="font-medium text-gray-900">{oneRMs.length > 0 ? `${oneRMs[oneRMs.length - 1]} kg` : "--"}</span>
                </div>
                <ProgressBar label="" progress={exerciseScore} colorClass="bg-blue-400" showText={false} />
              </div>
            </div>

            {/* Weight Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <h3 className="text-lg font-semibold text-blue-500 mb-4">Weight Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Goal</span>
                  <span className="font-medium text-gray-900">{goalWeight} kg</span>
                </div>
                <ProgressBar label="" progress={weightScore} colorClass="bg-blue-300" showText={false} />
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Actual: {currentActualWeight} kg</span>
                  <span>Rate: {actualWeeklyChange.toFixed(2)} kg/wk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 w-full">
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
                <div className="flex gap-2">
                  <select 
                    value={selectedBodyPart}
                    onChange={handleBodyPartChange}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-gray-700"
                  >
                    {Object.keys(defaultExerciseDatabase).map(part => <option key={part} value={part}>{part}</option>)}
                  </select>
                  <select 
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-gray-700"
                  >
                    {getAvailableExercises(selectedBodyPart).map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>
              <div className="h-64">
                {dates.length > 0 ? (
                  <StrengthChart dates={dates} oneRMs={oneRMs} exerciseName={selectedExercise} />
                ) : (
                  <p className="text-gray-500 text-center py-20">No logs for this exercise yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
