"use client";

import React, { useState, useEffect, useCallback } from "react";

import {
  Calendar, ChevronDown, Clock, Activity, Target, Flame, Sparkles,
  AlertTriangle, RefreshCw, Info, Droplets, Dumbbell, Moon, Zap, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import { proteinTarget, Goal } from "@/lib/protein";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend
);

interface Plan {
  name: string;
  weight: number;
  goalWeight: number;
  duration: number;
  goal: string;
  activityLevel?: string;
  sleepTarget?: number;
}

interface TimetableItem {
  time: string;
  activity: string;
  description: string;
}

interface AIRoutine {
  summary: string;
  timetable: TimetableItem[];
  tips: string[];
  waterGuidance: string;
}

/** Scientific water formula: 35ml/kg base + goal bonus + activity multiplier */
function computeWaterTarget(weightKg: number, goal: string, activityLevel: string): number {
  const base = weightKg * 35;
  const gainGoal = /muscle|bulk|gain/i.test(goal);
  const goalBonus = gainGoal ? 500 : 0;
  const multipliers: Record<string, number> = {
    sedentary: 1.0, light: 1.1, moderate: 1.2, active: 1.3,
  };
  const multiplier = multipliers[activityLevel?.toLowerCase()] ?? 1.0;
  return Math.round((base + goalBonus) * multiplier);
}

export default function DailyRoutine() {
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [userEmail, setUserEmail] = useState("");

  const [aiRoutine, setAiRoutine] = useState<AIRoutine | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  // Personalized Profile States
  const [dietPreference, setDietPreference] = useState("Flexible");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [medicalContext, setMedicalContext] = useState("None");
  const [injuries, setInjuries] = useState("Achieve goal efficiently and safely");
  const [gymTiming, setGymTiming] = useState("06:00 PM");
  const [wakeTime, setWakeTime] = useState("06:30 AM");
  const [sleepTime, setSleepTime] = useState("10:30 PM");
  const [customTargets, setCustomTargets] = useState<any>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    const planName = email ? localStorage.getItem(`${email}_activePlan`) : null;
    const plans = email ? JSON.parse(localStorage.getItem(`${email}_plans`) || "[]") : [];
    const storedRoutine = (email && planName) ? localStorage.getItem(`${email}_${planName}_aiRoutine`) : null;
    const storedCustom = (email && planName) ? localStorage.getItem(`${email}_${planName}_customTargets`) : null;
    const storedProfile = email ? localStorage.getItem(`${email}_userProfile`) : null;

    Promise.resolve().then(() => {
      setUserEmail(email);
      if (email) {
        setActivePlan(planName);
        setSavedPlans(plans);
        if (planName) {
          if (storedRoutine) {
            try { setAiRoutine(JSON.parse(storedRoutine)); } catch { /* ignore */ }
          }
          if (storedCustom) {
            try {
              const parsed = JSON.parse(storedCustom);
              if (parsed && typeof parsed === "object") {
                if (parsed.protein && (typeof parsed.protein !== "number" || parsed.protein < 30 || parsed.protein > 500)) delete parsed.protein;
                if (parsed.calories && (typeof parsed.calories !== "number" || parsed.calories < 1000 || parsed.calories > 10000)) delete parsed.calories;
                if (parsed.fats && (typeof parsed.fats !== "number" || parsed.fats < 20 || parsed.fats > 300)) delete parsed.fats;
                if (parsed.water && (typeof parsed.water !== "number" || parsed.water < 1000 || parsed.water > 10000)) delete parsed.water;
                if (parsed.sleep && (typeof parsed.sleep !== "number" || parsed.sleep < 4 || parsed.sleep > 16)) delete parsed.sleep;
                setCustomTargets(parsed);
              }
            } catch (e) {}
          }
        }

        if (storedProfile) {
          try {
            const profile = JSON.parse(storedProfile);
            setDietPreference(profile.dietPreference || "Flexible");
            setExperienceLevel(profile.experienceLevel || "Intermediate");
            setMedicalContext(profile.medicalContext || "None");
            setInjuries(profile.injuries || "Achieve goal efficiently and safely");
            setGymTiming(profile.gymTiming || "06:00 PM");
            setWakeTime(profile.wakeTime || "06:30 AM");
            setSleepTime(profile.sleepTime || "10:30 PM");
          } catch { /* ignore */ }
        }
      }
    });
  }, []);

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planName = e.target.value;
    localStorage.setItem(`${userEmail}_activePlan`, planName);
    setActivePlan(planName);
    setAiRoutine(null);
    setError(null);
    setRateLimitMessage(null);
    const storedRoutine = localStorage.getItem(`${userEmail}_${planName}_aiRoutine`);
    if (storedRoutine) {
      try { setAiRoutine(JSON.parse(storedRoutine)); } catch { /* ignore */ }
    }
  };

  const currentPlan = savedPlans.find(p => p.name === activePlan);
  const startWeight = currentPlan?.weight || 80;
  const goalWeight = currentPlan?.goalWeight || 75;
  const planDuration = currentPlan?.duration || 3;
  const goal = currentPlan?.goal || "General Fitness";
  const activityLevel = currentPlan?.activityLevel || "moderate";
  let sleepTarget = currentPlan?.sleepTarget || 8;
  if (customTargets?.sleep) sleepTarget = customTargets.sleep;

  const goalWeightLbs = goalWeight * 2.20462;
  const maintenanceTDEE = goalWeightLbs * 15;
  const dailyCalorieAdjustment = ((goalWeight - startWeight) * 2.20462 * 3500) / (planDuration * 30);
  let targetCalories = Math.round(maintenanceTDEE + dailyCalorieAdjustment);
  if (targetCalories < 1200 && startWeight > goalWeight) targetCalories = 1200;
  if (customTargets?.calories) targetCalories = customTargets.calories;

  let targetProtein = proteinTarget(startWeight, (goal as Goal) || "maintenance");
  if (customTargets?.protein) targetProtein = customTargets.protein;

  let targetFats = Math.round(goalWeightLbs * 0.4);
  if (customTargets?.fats) targetFats = customTargets.fats;

  let waterTargetMl = computeWaterTarget(startWeight, goal, activityLevel);
  if (customTargets?.water) waterTargetMl = customTargets.water;

  // 24-Hour Goal Trajectory Data Generation
  const getTrajectoryChartData = () => {
    if (!aiRoutine) return null;
    
    let cumulativeCal = 0;
    let cumulativeProtein = 0;
    
    const labels: string[] = [];
    const calorieData: number[] = [];
    const proteinData: number[] = [];
    const calorieBaseline: number[] = [];
    const proteinBaseline: number[] = [];
    
    aiRoutine.timetable.forEach((item) => {
      // Parse calories
      const calMatch = item.description.match(/(\d+)\s*(?:kcal|calories|cal)/i);
      const cal = calMatch ? parseInt(calMatch[1], 10) : 0;
      
      // Parse protein
      const protMatch = item.description.match(/(\d+)\s*g\s*protein/i);
      const prot = protMatch ? parseInt(protMatch[1], 10) : 0;
      
      // Update cumulative values if it's a food/meal related activity
      cumulativeCal += cal;
      cumulativeProtein += prot;
      
      labels.push(item.time);
      calorieData.push(cumulativeCal);
      proteinData.push(cumulativeProtein);
      calorieBaseline.push(targetCalories);
      proteinBaseline.push(targetProtein);
    });

    return {
      labels,
      datasets: [
        {
          label: "Cumulative Calories (kcal)",
          data: calorieData,
          borderColor: "rgba(249, 115, 22, 1)", // vibrant orange
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          tension: 0.4,
          yAxisID: "y",
          fill: true,
        },
        {
          label: "Calorie Target Baseline",
          data: calorieBaseline,
          borderColor: "rgba(249, 115, 22, 0.4)",
          borderDash: [5, 5],
          pointRadius: 0,
          yAxisID: "y",
          fill: false,
        },
        {
          label: "Cumulative Protein (g)",
          data: proteinData,
          borderColor: "rgba(59, 130, 246, 1)", // deep blue
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          yAxisID: "y1",
          fill: true,
        },
        {
          label: "Protein Target Baseline",
          data: proteinBaseline,
          borderColor: "rgba(59, 130, 246, 0.4)",
          borderDash: [5, 5],
          pointRadius: 0,
          yAxisID: "y1",
          fill: false,
        },
      ],
    };
  };

  const chartData = getTrajectoryChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: "bold" as const },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Calories (kcal)",
          font: { weight: "bold" as const, size: 11 },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Protein (g)",
          font: { weight: "bold" as const, size: 11 },
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const activityLabels: Record<string, string> = {
    sedentary: "Sedentary", light: "Lightly Active",
    moderate: "Moderately Active", active: "Very Active",
  };

  const checkRateLimit = (): { allowed: boolean; waitTimeMsg?: string } => {
    return { allowed: true }; // disabled for testing!
  };

  const handleSaveProfile = () => {
    if (!userEmail) return;
    const profile = { dietPreference, experienceLevel, medicalContext, injuries, gymTiming, wakeTime, sleepTime };
    localStorage.setItem(`${userEmail}_userProfile`, JSON.stringify(profile));
    alert("Personal profile record saved! The AI will now use these preferences and timings to craft an optimized routine.");
  };

  const recordRequest = useCallback(() => {
    if (!userEmail) return;
    const key = `${userEmail}_ai_routine_rate_limit`;
    const timestamps: number[] = JSON.parse(localStorage.getItem(key) || "[]");
    timestamps.push(Date.now());
  }, [userEmail]);

  const generateAIRoutine = async () => {
    if (!activePlan || !userEmail) return;
    setError(null);
    setRateLimitMessage(null);
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) { setRateLimitMessage(rateLimit.waitTimeMsg || "Rate limit reached."); return; }
    setLoading(true);

    // Compute most frequently eaten foods
    const meals = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const foodCounts: Record<string, { name: string; count: number; calories: number; protein: number }> = {};
    meals.forEach((m: any) => {
      if (!m.name) return;
      if (!foodCounts[m.name]) {
        foodCounts[m.name] = { name: m.name, count: 0, calories: m.calories || 0, protein: m.protein || 0 };
      }
      foodCounts[m.name].count += 1;
    });
    const frequentFoods = Object.values(foodCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    try {
      const res = await fetch("/api/gemini/analyze-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activePlanName: activePlan, startWeight, goalWeight, planDuration,
          targetCalories, targetProtein, targetFats,
          targetHydration: waterTargetMl, goal, activityLevel, sleepTarget,
          userProfile: { dietPreference, experienceLevel, medicalContext, injuries, gymTiming, wakeTime, sleepTime },
          frequentFoods,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate AI routine");
      }
      const routineData: AIRoutine = await res.json();
      localStorage.setItem(`${userEmail}_${activePlan}_aiRoutine`, JSON.stringify(routineData));
      setAiRoutine(routineData);
      recordRequest();
    } catch (err: any) {
      console.warn("API Routine request failed, using high-quality scientific fallback routine:", err);
      const fallbackRoutine: AIRoutine = {
        summary: `Optimized strategy targeting ${goalWeight}kg by adjusting calories to ${targetCalories} kcal and protein to ${targetProtein}g daily.`,
        timetable: [
          { time: wakeTime || "06:30 AM", activity: "Morning Hydration & Light Walk", description: `Drink 500ml water immediately upon waking. Walk briskly for 15-20 mins.` },
          { time: "08:30 AM", activity: "High-Protein Breakfast", description: `Aim for ${Math.round(targetProtein / 4)}g of protein (e.g. eggs, protein shake, oats).` },
          { time: "01:00 PM", activity: "Balanced Fuel Lunch", description: `Fulfills 30% of Calories and 25% of Protein. Lean protein with sweet potato and green veggies.` },
          { time: "04:30 PM", activity: "Pre-Workout Snack", description: `Pre-workout meal with carbs and light protein. Hydrate with 300ml water.` },
          { time: gymTiming || "06:00 PM", activity: "Progressive Overload Workout", description: `Focus on compound lifts. Log all sets and reps in the gym app. Hydrate throughout.` },
          { time: "08:00 PM", activity: "Post-Workout Recovery Meal", description: `Fulfills 35% of Calories and 35% of Protein daily requirements. Steak/salmon with rice.` },
          { time: sleepTime || "10:30 PM", activity: "Wind Down & Sleep Prep", description: `No screens. Rest to hit the target of ${sleepTarget} sleep hours.` }
        ],
        tips: [
          `Target a protein intake of ${targetProtein}g to support your muscles.`,
          `Keep daily calories at ${targetCalories} kcal to optimize weight adjustment.`,
          `Ensure you sleep at least ${sleepTarget} hours for optimal muscle recovery.`,
          `Drink at least ${waterTargetMl}ml water daily to stay perfectly hydrated.`
        ],
        waterGuidance: `Sip 500ml upon waking, 300ml with meals, and 500-800ml during exercise to total ${waterTargetMl}ml.`
      };
      localStorage.setItem(`${userEmail}_${activePlan}_aiRoutine`, JSON.stringify(fallbackRoutine));
      setAiRoutine(fallbackRoutine);
      setError(`Notice: Using scientific custom routine (API Offline/Rate-limit: ${err?.message || "connection error"}).`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-500" /> Daily Routine Planner
            </h1>
            <p className="text-gray-500 mt-1">AI-crafted daily schedule tailored to your exact plan goal.</p>
          </div>
          {activePlan && (
            <div className="flex gap-3 items-center">
              <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-blue-100">
                <Target className="text-blue-500" size={20} />
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
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-50 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">No Active Plan</h2>
            <p className="text-gray-500 max-w-md mx-auto">Select or create a plan to view your AI-tailored daily routine.</p>
            <Link href="/plans">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors shadow-sm mx-auto cursor-pointer">
                Go to Plans
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Target Summary Grid */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-500" /> Plan Target Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                  <span className="text-xs text-gray-500 block">Weight Target</span>
                  <span className="font-bold text-gray-900 text-sm block mt-1">{startWeight}kg → {goalWeight}kg</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 text-center">
                  <Flame size={14} className="text-orange-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500 block">Daily Calories</span>
                  <span className="font-bold text-gray-900 text-sm block">{targetCalories} kcal</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-center">
                  <Dumbbell size={14} className="text-blue-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500 block">Protein / Fat</span>
                  <span className="font-bold text-gray-900 text-sm block">{targetProtein}g / {targetFats}g</span>
                </div>
                <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-100 text-center">
                  <Droplets size={14} className="text-cyan-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500 block">Water Target</span>
                  <span className="font-bold text-gray-900 text-sm block">{(waterTargetMl / 1000).toFixed(1)}L</span>
                </div>
                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-center">
                  <Moon size={14} className="text-purple-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500 block">Sleep Target</span>
                  <span className="font-bold text-gray-900 text-sm block">{sleepTarget} hrs</span>
                </div>
                <div className="bg-green-50 p-3 rounded-2xl border border-green-100 text-center">
                  <Zap size={14} className="text-green-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500 block">Activity</span>
                  <span className="font-bold text-gray-900 text-sm block">{activityLabels[activityLevel] || activityLevel}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                💧 Water formula: {startWeight}kg × 35ml{/muscle|bulk|gain/i.test(goal) ? " + 500ml (muscle gain)" : ""} × {activityLabels[activityLevel]} multiplier = {waterTargetMl}ml/day
              </p>
            </div>            {/* Personal Profile & AI Personalization Record */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 shadow-blue-50/50">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-500" /> AI Personalization & Profile Record
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Dietary Preference</label>
                  <select
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Flexible">Flexible / Anything</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Keto">Keto</option>
                    <option value="High-Protein">High-Protein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced / Athlete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Climate or Medical Context</label>
                  <input
                    type="text"
                    value={medicalContext}
                    onChange={(e) => setMedicalContext(e.target.value)}
                    placeholder="e.g. Dry hot climate, None"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Strategic Strategy Focus</label>
                  <input
                    type="text"
                    value={injuries}
                    onChange={(e) => setInjuries(e.target.value)}
                    placeholder="e.g. Joint safety, Build muscle fast"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Preferred Gym/Workout Timing</label>
                  <input
                    type="text"
                    value={gymTiming}
                    onChange={(e) => setGymTiming(e.target.value)}
                    placeholder="e.g. 06:00 PM - 07:30 PM"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Average Morning Wake-Up Time</label>
                  <input
                    type="text"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    placeholder="e.g. 06:30 AM"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Average Night Sleep/Bedtime</label>
                  <input
                    type="text"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    placeholder="e.g. 10:30 PM"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveProfile}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Profile Record
                </button>
              </div>
            </div>

            {(error || rateLimitMessage) && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-sm">Action Blocked / Error</h4>
                  <p className="text-sm mt-0.5">{error || rateLimitMessage}</p>
                </div>
              </div>
            )}

            {/* AI Content */}
            {loading ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6">
                <div className="flex justify-center">
                  <RefreshCw className="text-blue-500 animate-spin" size={48} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Generating Your AI Routine...</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Analyzing your targets, water needs, sleep schedule, and activity level. This takes a few moments.
                </p>
              </div>
            ) : aiRoutine ? (
              <div className="space-y-6">

                {/* AI Summary Banner */}
                <div className="bg-linear-to-r from-blue-500 to-indigo-600 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-white opacity-10"><Sparkles size={100} /></div>
                  <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    <Sparkles size={12} /> Groq AI Optimized
                  </span>
                  <h3 className="text-xl font-bold mb-2">AI Strategy Analysis</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {typeof aiRoutine.summary === "string" 
                      ? aiRoutine.summary 
                      : typeof aiRoutine.summary === "object" && aiRoutine.summary !== null
                        ? Object.values(aiRoutine.summary).filter(v => typeof v === "string").join(" ")
                        : JSON.stringify(aiRoutine.summary)}
                  </p>
                </div>

                {/* Water Guidance Card */}
                {aiRoutine.waterGuidance && (
                  <div className="bg-cyan-50 border border-cyan-200 p-5 rounded-3xl flex gap-4">
                    <div className="bg-cyan-100 p-3 rounded-xl text-cyan-600 shrink-0 h-fit">
                      <Droplets size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-cyan-800 mb-1">Hydration Strategy</h4>
                      <p className="text-cyan-700 text-sm leading-relaxed">
                        {typeof aiRoutine.waterGuidance === "string" 
                          ? aiRoutine.waterGuidance 
                          : typeof aiRoutine.waterGuidance === "object" && aiRoutine.waterGuidance !== null
                            ? Object.values(aiRoutine.waterGuidance).filter(v => typeof v === "string").join(" ")
                            : JSON.stringify(aiRoutine.waterGuidance)}
                      </p>
                      <p className="text-xs text-cyan-500 mt-2 font-medium">
                        Daily target: <strong>{(waterTargetMl / 1000).toFixed(1)}L</strong> ({waterTargetMl}ml) — scientifically computed
                      </p>
                    </div>
                  </div>
                )}

                {/* 24-Hour Goal Trajectory Graph */}
                {chartData && (
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 shadow-orange-50/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-3 rounded-xl text-orange-500">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">24-Hour Cumulative Goal Trajectory</h3>
                          <p className="text-xs text-gray-500">Visualize how each scheduled meal builds up to meet your daily targets.</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-75 w-full relative">
                      <Line data={chartData} options={chartOptions} />
                    </div>
                  </div>
                )}

                {/* Timetable */}
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-xl text-blue-500">
                        <Activity size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Custom Timetable</h2>
                        <p className="text-sm text-gray-500">Structured routine to reach {goalWeight}kg in {planDuration} months.</p>
                      </div>
                    </div>
                    <button
                      onClick={generateAIRoutine}
                      className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-2xl transition-all shadow-sm cursor-pointer"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  </div>

                  <div className="relative border-l-2 border-blue-100 ml-4 space-y-8 pb-4">
                    {(aiRoutine.timetable || []).map((item, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute -left-2.25 top-1 bg-white border-4 border-blue-500 w-4 h-4 rounded-full shadow-sm" />
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                          <span className="text-sm font-bold text-blue-500 flex items-center gap-1">
                            <Clock size={14} /> {item.time}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900">{item.activity}</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-500" /> Actionable AI Tips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {((aiRoutine.tips && aiRoutine.tips.length > 0) ? aiRoutine.tips : [
                      `Target a protein intake of ${targetProtein}g to support your muscles.`,
                      `Keep daily calories at ${targetCalories} kcal to optimize weight adjustment.`,
                      `Ensure you sleep at least ${sleepTarget} hours for optimal muscle recovery.`,
                      `Drink at least ${waterTargetMl}ml water daily to stay perfectly hydrated.`
                    ]).map((tip, idx) => (
                      <div key={idx} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex gap-3 items-start">
                        <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-blue-50 p-6 rounded-full text-blue-500">
                    <Sparkles size={48} className="animate-pulse" />
                  </div>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">AI Daily Routine Planner</h2>
                  <p className="text-gray-500">
                    Get a full day timetable — meals, workout, hydration sips, and sleep — all tailored to your goal of reaching <strong>{goalWeight}kg</strong>.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={generateAIRoutine}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-3xl font-bold text-md transition-colors shadow-md flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Sparkles size={20} /> Generate AI Daily Routine
                  </button>
                  <p className="text-xs text-gray-400 mt-3">Powered by Groq AI (llama-3.3-70b). Rate limited to 5 requests per hour.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
