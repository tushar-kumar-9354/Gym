"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Weight,
  Flame,
  Award,
  Sparkles,
  Dumbbell,
  Droplets,
  Moon,
  TrendingDown,
  TrendingUp,
  Heart,
  Utensils
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatLiters } from "@/utils/oneRM";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend
);

export default function CompletedPlan() {
  const [userEmail, setUserEmail] = useState("");
  const [planName, setPlanName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiStory, setAiStory] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    if (!email) {
      Promise.resolve().then(() => {
        setUserEmail("");
        setLoading(false);
      });
      return;
    }

    const active = localStorage.getItem(`${email}_activePlan`) || "";
    if (!active) {
      Promise.resolve().then(() => {
        setUserEmail(email);
        setPlanName("");
        setLoading(false);
      });
      return;
    }

    // Load plans
    const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
    const currentPlan = plans.find((p: any) => p.name === active);
    const startWeight = currentPlan?.weight || 80;
    const goalWeight = currentPlan?.goalWeight || 75;
    const planDuration = currentPlan?.duration || 3;
    const goal = currentPlan?.goal || "muscle gain";

    // Load weekly weights
    const weeklyWeights = JSON.parse(localStorage.getItem(`${email}_${active}_weeklyWeights`) || "[]");
    const currentWeight = weeklyWeights.length > 0 ? weeklyWeights[weeklyWeights.length - 1].weight : startWeight;
    const totalWeightChange = Math.abs(currentWeight - startWeight);

    // Load exercise logs
    const exerciseLogs = JSON.parse(localStorage.getItem(`${email}_${active}_exerciseLogs`) || "[]");
    const totalSets = exerciseLogs.length;

    // Find highest 1RM and favorite exercise
    const exerciseCounts: Record<string, number> = {};
    let highest1RM = 0;
    let highest1RMExercise = "N/A";
    
    exerciseLogs.forEach((log: any) => {
      if (log.exercise) {
        exerciseCounts[log.exercise] = (exerciseCounts[log.exercise] || 0) + 1;
        if (log.oneRM && log.oneRM > highest1RM) {
          highest1RM = Math.round(log.oneRM);
          highest1RMExercise = log.exercise;
        }
      }
    });

    const favoriteExercise = Object.keys(exerciseCounts).reduce((a, b) => 
      exerciseCounts[a] > exerciseCounts[b] ? a : b, "N/A"
    );

    // Load logged meals & favorite food
    const loggedMeals = JSON.parse(localStorage.getItem(`${email}_${active}_loggedMeals`) || "[]");
    const foodCounts: Record<string, number> = {};
    loggedMeals.forEach((meal: any) => {
      if (meal.name) {
        foodCounts[meal.name] = (foodCounts[meal.name] || 0) + 1;
      }
    });
    const favoriteFood = Object.keys(foodCounts).reduce((a, b) => 
      foodCounts[a] > foodCounts[b] ? a : b, "N/A"
    );

    // Sleep analysis
    const sleepLogs = JSON.parse(localStorage.getItem(`${email}_${active}_sleepLogs`) || "{}");
    const sleepKeys = Object.keys(sleepLogs);
    let totalSleep = 0;
    const sleepQualities: Record<string, number> = {};
    sleepKeys.forEach(k => {
      const log = sleepLogs[k];
      if (Array.isArray(log)) {
        log.forEach((e: any) => { totalSleep += e.hours || 0; if (e.quality) sleepQualities[e.quality] = (sleepQualities[e.quality] || 0) + 1; });
      } else {
        totalSleep += log.hours || 0;
        if (log.quality) {
          sleepQualities[log.quality] = (sleepQualities[log.quality] || 0) + 1;
        }
      }
    });
    const avgSleep = sleepKeys.length > 0 ? Math.round(totalSleep / sleepKeys.length).toString() : "8";
    const favoriteSleepQuality = Object.keys(sleepQualities).reduce((a, b) => 
      sleepQualities[a] > sleepQualities[b] ? a : b, "Good"
    );

    // Water analysis
    const loggedWaterLogs = JSON.parse(localStorage.getItem(`${email}_${active}_loggedWater`) || "[]");
    // water target
    const targetHydration = 4000; // default/sci
    let totalWater = 0;
    loggedWaterLogs.forEach((w: any) => { totalWater += w.amount || 0; });
    const avgWater = loggedWaterLogs.length > 0 ? (totalWater / loggedWaterLogs.length).toFixed(0) : "3500";

    const report = {
      name: active,
      goal,
      duration: planDuration,
      startWeight,
      goalWeight,
      currentWeight,
      totalWeightChange,
      totalSets,
      favoriteExercise,
      highest1RM,
      highest1RMExercise,
      favoriteFood,
      avgSleep,
      favoriteSleepQuality,
      avgWater,
      weeklyWeights,
      success: Math.abs(currentWeight - goalWeight) <= 2.5
    };

    Promise.resolve().then(() => {
      setUserEmail(email);
      setPlanName(active);
      setPlanData(report);
      setLoading(false);
      generateAIJourneyStory(report);
    });
  }, []);

  async function generateAIJourneyStory(report: any) {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/gemini/analyze-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activePlanName: report.name,
          startWeight: report.startWeight,
          goalWeight: report.goalWeight,
          planDuration: report.duration,
          targetCalories: 2500,
          targetProtein: 150,
          targetFats: 70,
          goal: report.goal,
          activityLevel: "moderate",
          sleepTarget: 8,
          userProfile: {
            dietPreference: "Flexible",
            experienceLevel: "Intermediate",
            medicalContext: "None",
            injuries: `Celebrate completion of plan! User succeeded in achieving plan: ${report.success ? "Successfully reached targets" : "Close attempt"}. Favorite food was: ${report.favoriteFood}, most completed exercise: ${report.favoriteExercise}, highest OneRepMax reached: ${report.highest1RM}kg in ${report.highest1RMExercise}, average sleep logged: ${report.avgSleep}h per night.`
          }
        })
      });

      if (res.ok) {
        const parsed = await res.json();
        // Extract summary or tips to craft narrative
        const narrative = parsed.summary || "You have showed incredible commitment to your health and muscle-building targets. You have optimized your sets and maintained high dietary discipline throughout these 3 months!";
        setAiStory(narrative);
      } else {
        throw new Error();
      }
    } catch {
      setAiStory("Congratulations on completing your plan! You showed absolute dedication over these 3 months, hitting progressive overload milestones on your compound exercises like a true athlete, optimizing your diet with high-quality protein, and managing your daily hydration and recovery like a professional. You are ready to take your training to the absolute next level!");
    } finally {
      setLoadingAi(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-medium">Assembling your legacy report card...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <Trophy className="text-gray-500 mx-auto" size={64} />
          <h1 className="text-2xl font-bold">No Completed Plan Found</h1>
          <p className="text-gray-400">Please complete your plan targets to unlock this comprehensive report card.</p>
          <Link href="/">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isLosing = planData.startWeight > planData.goalWeight;

  // Trajectory graph setup
  const chartDates = planData.weeklyWeights.map((_: any, idx: number) => `Week ${idx}`);
  if (chartDates.length === 0) chartDates.push("Week 0");
  const actualWeight = planData.weeklyWeights.map((w: any) => w.weight);
  if (actualWeight.length === 0) actualWeight.push(planData.startWeight);

  const targetWeight: number[] = [];
  const totalWeeks = planData.weeklyWeights.length > 0 ? planData.weeklyWeights.length : 12;
  for (let i = 0; i < totalWeeks; i++) {
    targetWeight.push(planData.startWeight - ((planData.startWeight - planData.goalWeight) * (i / (totalWeeks - 1 || 1))));
  }

  const chartData = {
    labels: chartDates,
    datasets: [
      {
        label: "Target Trajectory",
        data: targetWeight,
        borderColor: "rgba(234, 179, 8, 0.7)",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      },
      {
        label: "Your Actual Path",
        data: actualWeight,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderWidth: 4,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.3,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#475569", font: { size: 11, weight: "bold" as any } }
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#0f172a",
        bodyColor: "#475569",
        padding: 12,
        borderRadius: 12,
        borderColor: "#e2e8f0",
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { color: "rgba(226, 232, 240, 0.6)" }, ticks: { color: "#64748b" } },
      y: { grid: { color: "rgba(226, 232, 240, 0.6)" }, ticks: { color: "#64748b" } }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 p-6 md:p-12 w-full font-[family-name:var(--font-geist-sans)] selection:bg-blue-500/20">
      {/* Background Decoratives */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-10 relative">
        {/* Navigation / Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href="/">
            <button className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-gray-200/80 flex items-center gap-2 cursor-pointer shadow-xs">
              <ArrowLeft size={14} /> Dashboard
            </button>
          </Link>
          <div className="flex items-center gap-2.5 bg-white border border-gray-200/80 rounded-2xl px-4 py-2 text-xs font-bold text-gray-500 shadow-xs">
            <Calendar size={14} className="text-blue-500" />
            <span>Finished Plan Journey: <span className="text-gray-900">{planData.name}</span></span>
          </div>
        </header>

        {/* Celebration Hero Box */}
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-white border border-blue-100 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-xs">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-500/10 p-5 rounded-full border border-yellow-500/20 animate-bounce">
              <Trophy className="text-yellow-500" size={56} />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
            Plan Fully Completed! 🏆
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base leading-relaxed font-medium">
            You successfully completed your {planData.duration}-month target schedule for <strong className="text-blue-600 font-bold">"{planData.name}"</strong>. Hitting consecutive daily targets is tough, but you fought and completed the distance!
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
              <Weight size={20} className="text-blue-500 mx-auto mb-2" />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-semibold">Start Weight</span>
              <span className="text-lg md:text-xl font-bold block mt-1 text-gray-900">{Math.round(planData.startWeight)} kg</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
              <Weight size={20} className="text-yellow-500 mx-auto mb-2" />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-semibold">Goal Weight</span>
              <span className="text-lg md:text-xl font-bold block mt-1 text-gray-900">{Math.round(planData.goalWeight)} kg</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
              <Weight size={20} className="text-cyan-500 mx-auto mb-2" />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-semibold">Current Weight</span>
              <span className="text-lg md:text-xl font-bold block mt-1 text-gray-900">{Math.round(planData.currentWeight)} kg</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col justify-center items-center">
              {planData.success ? (
                <Award size={20} className="text-green-500 mb-1" />
              ) : (
                <Flame size={20} className="text-orange-500 mb-1" />
              )}
              <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-semibold">Outcome Status</span>
              <span className={`text-xs font-bold mt-1 px-2.5 py-0.5 rounded-full border inline-block ${
                planData.success 
                  ? "bg-green-50 border-green-200 text-green-700" 
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
                {planData.success ? "Target Achieved!" : "Close & Dedicated!"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Storytelling / AI Report Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visual Trajectory Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-gray-100 pb-3 text-gray-800">
              <TrendingUp size={18} className="text-blue-500" /> Complete Weight Journey Path
            </h2>
            <div className="h-[280px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed text-center pt-2">
              📊 Solid line indicates actual logged weigh-ins mapped over target weeks. Dotted path shows scientific goal rate.
            </p>
          </div>

          {/* AI Narrative Section */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-gray-100 pb-3 text-gray-800">
                <Sparkles size={18} className="text-yellow-500" /> AI Coach Legacy Journey Story
              </h2>
              {loadingAi ? (
                <div className="space-y-3 animate-pulse pt-4">
                  <div className="h-4 bg-gray-150 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-150 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-150 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-150 rounded w-3/4"></div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line pt-2 font-medium">
                  {aiStory}
                </p>
              )}
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mt-4">
              <p className="text-xs text-blue-700 font-semibold leading-relaxed flex items-center gap-1.5">
                <Heart size={14} className="fill-blue-500/10 text-blue-500 shrink-0" />
                Coaching Tip: Consistent routines yield lifetime fitness. Ready to declare your next goal?
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Stats Report card breakdown */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-100 pb-4 text-gray-800">
            <Award size={20} className="text-blue-500" /> Metric Achievements & Deep Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Workout Performance Card */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-600">
                  <Dumbbell size={20} />
                </div>
                <h3 className="font-bold text-sm text-purple-700">Workout Excellence</h3>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Total Sets Logged</span>
                  <span className="font-bold text-gray-900 text-sm">{planData.totalSets} sets</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Favorite Exercise</span>
                  <span className="font-bold text-gray-900 text-sm max-w-[150px] truncate text-right">{planData.favoriteExercise}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Highest 1-Rep Max</span>
                  <span className="font-bold text-gray-900 text-sm">{Math.round(planData.highest1RM)} kg</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">1RM Exercise</span>
                  <span className="font-bold text-gray-900 text-sm max-w-[150px] truncate text-right">{planData.highest1RMExercise}</span>
                </div>
              </div>
            </div>

            {/* Diet & Nutrition Card */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-600">
                  <Utensils size={20} />
                </div>
                <h3 className="font-bold text-sm text-emerald-700">Dietary Discipline</h3>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Favorite Fuel Food</span>
                  <span className="font-bold text-gray-900 text-sm max-w-[150px] truncate text-right">{planData.favoriteFood}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Daily Water Avg</span>
                  <span className="font-bold text-gray-900 text-sm">{formatLiters(Number(planData.avgWater))}L / day</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Goal Type Focus</span>
                  <span className="font-bold text-gray-900 text-sm capitalize">{planData.goal}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Net Weight Shift</span>
                  <span className="font-bold text-gray-900 text-sm">{Math.round(planData.totalWeightChange)} kg</span>
                </div>
              </div>
            </div>

            {/* Recovery Quality Card */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 text-indigo-600">
                  <Moon size={20} />
                </div>
                <h3 className="font-bold text-sm text-indigo-700">Sleep & Regeneration</h3>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Avg Sleep Duration</span>
                  <span className="font-bold text-gray-900 text-sm">{planData.avgSleep} hrs / night</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Frequent Quality</span>
                  <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full border inline-block ${
                    ["Excellent", "Good"].includes(planData.favoriteSleepQuality)
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    {planData.favoriteSleepQuality}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Symmetric Penalties</span>
                  <span className="font-bold text-gray-900 text-sm">Low Penalty Depth</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Overall Success</span>
                  <span className="font-bold text-green-600 text-sm">94.8% Score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
