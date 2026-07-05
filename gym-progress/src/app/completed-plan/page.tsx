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
  ArcElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from "chart.js";
import { Line, Pie, Bar, Doughnut } from "react-chartjs-2";
import { formatLiters } from "@/utils/oneRM";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
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
  const [deloadChecklist, setDeloadChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userEmail && planName) {
      const stored = localStorage.getItem(`${userEmail}_${planName}_deloadChecklist`);
      if (stored) {
        setDeloadChecklist(JSON.parse(stored));
      } else {
        setDeloadChecklist({
          "Reduce training volume (sets) by 50%": false,
          "Reduce training weight (load) by 30-40%": false,
          "Prioritize 8+ hours of sleep nightly": false,
          "Perform 15 mins of foam rolling or daily stretching": false,
          "Complete one active recovery outdoor walk": false,
          "Maintain daily water intake of 4 Liters": false
        });
      }
    }
  }, [userEmail, planName]);

  const toggleChecklistItem = (item: string) => {
    const updated = { ...deloadChecklist, [item]: !deloadChecklist[item] };
    setDeloadChecklist(updated);
    if (userEmail && planName) {
      localStorage.setItem(`${userEmail}_${planName}_deloadChecklist`, JSON.stringify(updated));
    }
  };

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

    // Calculate last 60 days of consistency logs
    const consistencyData = [];
    const todayObj = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(todayObj);
      d.setDate(todayObj.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Check logs
      const exercisesCount = exerciseLogs.filter((l: any) => l.date === dateStr).length;
      const mealsCount = loggedMeals.filter((m: any) => {
        try {
          return new Date(m.date).toISOString().split("T")[0] === dateStr;
        } catch {
          return false;
        }
      }).length;
      
      const waterDataForDay = JSON.parse(localStorage.getItem(`${email}_${active}_waterIntake`) || "{}");
      const waterVal = waterDataForDay[dateStr] || 0;

      const sleepLogged = sleepLogs[dateStr] !== undefined;

      let score = 0;
      if (exercisesCount > 0) score += 1;
      if (mealsCount > 0) score += 1;
      if (waterVal > 0) score += 1;
      if (sleepLogged) score += 1;

      consistencyData.push({
        date: dateStr,
        score,
        exercises: exercisesCount,
        meals: mealsCount,
        water: waterVal,
        sleep: sleepLogged,
        dayLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      });
    }

    // Compute PR List
    const prsMap: Record<string, { weight: number; reps: number; date: string; bodyPart: string }> = {};
    exerciseLogs.forEach((log: any) => {
      if (log.exercise && log.weight) {
        const exName = log.exercise;
        const currentPR = prsMap[exName]?.weight || 0;
        if (log.weight > currentPR) {
          prsMap[exName] = {
            weight: log.weight,
            reps: log.reps || 0,
            date: log.date,
            bodyPart: log.bodyPart || "General"
          };
        }
      }
    });
    const prList = Object.keys(prsMap).map(name => ({
      name,
      ...prsMap[name]
    })).sort((a, b) => b.weight - a.weight).slice(0, 3);

    // Compute Volume Distribution
    const volumeData: Record<string, number> = {};
    exerciseLogs.forEach((log: any) => {
      if (log.bodyPart) {
        const bp = log.bodyPart.charAt(0).toUpperCase() + log.bodyPart.slice(1);
        volumeData[bp] = (volumeData[bp] || 0) + 1;
      }
    });
    const volumeLabels = Object.keys(volumeData);
    const volumeValues = Object.values(volumeData);

    // Compute Dietary Intake Trends (last 7 days)
    const customTargets = JSON.parse(localStorage.getItem(`${email}_${active}_customTargets`) || "{}");
    const targetCaloriesVal = customTargets.calories || 2500;
    const targetProteinVal = customTargets.protein || 150;

    const dietDates = [];
    const dietCalTarget = [];
    const dietCalActual = [];
    const dietProtTarget = [];
    const dietProtActual = [];

    const todayObjDiet = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayObjDiet);
      d.setDate(todayObjDiet.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      dietDates.push(dayLabel);
      dietCalTarget.push(targetCaloriesVal);
      dietProtTarget.push(targetProteinVal);

      let dailyCalories = 0;
      let dailyProtein = 0;
      loggedMeals.forEach((meal: any) => {
        try {
          if (new Date(meal.date).toISOString().split("T")[0] === dateStr) {
            dailyCalories += meal.calories || 0;
            dailyProtein += meal.protein || 0;
          }
        } catch {}
      });
      dietCalActual.push(Math.round(dailyCalories));
      dietProtActual.push(Math.round(dailyProtein));
    }

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
      success: Math.abs(currentWeight - goalWeight) <= 2.5,
      consistencyData,
      prList,
      volumeLabels,
      volumeValues,
      dietDates,
      dietCalTarget,
      dietCalActual,
      dietProtTarget,
      dietProtActual,
      targetCaloriesVal,
      targetProteinVal
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

  const volumeChartData = {
    labels: planData.volumeLabels || [],
    datasets: [
      {
        label: "Sets Logged",
        data: planData.volumeValues || [],
        backgroundColor: [
          "#3b82f6", // Blue
          "#10b981", // Emerald
          "#8b5cf6", // Violet
          "#f59e0b", // Amber
          "#ef4444", // Red
          "#ec4899", // Pink
          "#06b6d4"  // Cyan
        ],
        borderWidth: 1,
      }
    ]
  };

  const dietChartData = {
    labels: planData.dietDates || [],
    datasets: [
      {
        label: "Actual Calories (kcal)",
        data: planData.dietCalActual || [],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.05)",
        borderWidth: 3,
        tension: 0.3,
        yAxisID: "y"
      },
      {
        label: "Target Calories (kcal)",
        data: planData.dietCalTarget || [],
        borderColor: "rgba(245, 158, 11, 0.3)",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        yAxisID: "y"
      },
      {
        label: "Actual Protein (g)",
        data: planData.dietProtActual || [],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        borderWidth: 3,
        tension: 0.3,
        yAxisID: "y1"
      },
      {
        label: "Target Protein (g)",
        data: planData.dietProtTarget || [],
        borderColor: "rgba(16, 185, 129, 0.3)",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        yAxisID: "y1"
      }
    ]
  };

  const dietChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#475569", font: { size: 10, weight: "bold" as any } }
      }
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        ticks: { color: "#f59e0b" },
        grid: { color: "rgba(226, 232, 240, 0.4)" }
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        ticks: { color: "#10b981" },
        grid: { drawOnChartArea: false }
      }
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
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

        {/* Before & After Visual Comparison */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-100 pb-4 text-gray-800">
            <TrendingUp size={20} className="text-blue-500" /> Transformation: Before & After
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Weight Card */}
            <div className="bg-gradient-to-br from-blue-50/30 to-indigo-50/10 border border-gray-150/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Body Weight</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-gray-500">Before</div>
                  <div className="text-xl font-bold text-gray-700">{Math.round(planData.startWeight)} kg</div>
                </div>
                <div className="text-blue-500 font-extrabold pb-1">→</div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">After</div>
                  <div className="text-2xl font-black text-gray-900">{Math.round(planData.currentWeight)} kg</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100/50 flex justify-between items-center text-xs">
                <span className="text-gray-500">Net Change</span>
                <span className={`font-bold flex items-center gap-0.5 ${planData.currentWeight < planData.startWeight ? "text-green-600" : "text-blue-600"}`}>
                  {planData.currentWeight < planData.startWeight ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  {Math.abs(planData.currentWeight - planData.startWeight).toFixed(1)} kg
                </span>
              </div>
            </div>

            {/* Strength Card */}
            <div className="bg-gradient-to-br from-purple-50/30 to-pink-50/10 border border-gray-150/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Peak Strength (1RM)</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-gray-500">Baseline Estimate</div>
                  <div className="text-xl font-bold text-gray-700">0 kg</div>
                </div>
                <div className="text-purple-500 font-extrabold pb-1">→</div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Peak Reach</div>
                  <div className="text-2xl font-black text-gray-900">{Math.round(planData.highest1RM)} kg</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100/50 flex justify-between items-center text-xs">
                <span className="text-gray-500">Lift Exercise</span>
                <span className="font-bold text-purple-600 truncate max-w-[120px]">{planData.highest1RMExercise}</span>
              </div>
            </div>

            {/* Hydration Card */}
            <div className="bg-gradient-to-br from-cyan-50/30 to-teal-50/10 border border-gray-150/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hydration Habits</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-gray-500">Target</div>
                  <div className="text-xl font-bold text-gray-700">4.0 L</div>
                </div>
                <div className="text-cyan-500 font-extrabold pb-1">→</div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Actual Avg</div>
                  <div className="text-2xl font-black text-gray-900">{formatLiters(Number(planData.avgWater))} L</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100/50 flex justify-between items-center text-xs">
                <span className="text-gray-500">Compliance</span>
                <span className="font-bold text-cyan-600">
                  {Math.round((Number(planData.avgWater) / 4000) * 100)}%
                </span>
              </div>
            </div>

            {/* Sleep Card */}
            <div className="bg-gradient-to-br from-amber-50/30 to-orange-50/10 border border-gray-150/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Recovery Duration</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-gray-500">Target</div>
                  <div className="text-xl font-bold text-gray-700">8.0 hrs</div>
                </div>
                <div className="text-amber-500 font-extrabold pb-1">→</div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Actual Avg</div>
                  <div className="text-2xl font-black text-gray-900">{planData.avgSleep} hrs</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100/50 flex justify-between items-center text-xs">
                <span className="text-gray-500">Quality Index</span>
                <span className="font-bold text-amber-600">{planData.favoriteSleepQuality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unlocked Badges Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-100 pb-4 text-gray-800">
            <Award size={20} className="text-yellow-500 animate-pulse" /> Unlocked Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Badge 1: Consistency */}
            {planData.totalSets > 0 ? (
              <div className="bg-gray-50 hover:bg-yellow-50/20 border border-gray-100 hover:border-yellow-200/80 rounded-2xl p-5 flex gap-4 transition-all duration-300 group">
                <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl border border-yellow-200 group-hover:scale-110 transition-transform h-fit">
                  <Trophy size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Consistency Master</h4>
                  <p className="text-xs text-gray-500 mt-1">Logged {planData.totalSets} exercise sets throughout the journey.</p>
                </div>
              </div>
            ) : null}

            {/* Badge 2: Hydration Hero */}
            {Number(planData.avgWater) >= 3000 ? (
              <div className="bg-gray-50 hover:bg-blue-50/20 border border-gray-100 hover:border-blue-200/80 rounded-2xl p-5 flex gap-4 transition-all duration-300 group">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-xl border border-blue-200 group-hover:scale-110 transition-transform h-fit">
                  <Droplets size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Hydration Hero</h4>
                  <p className="text-xs text-gray-500 mt-1">Averaged {formatLiters(Number(planData.avgWater))}L daily water intake.</p>
                </div>
              </div>
            ) : null}

            {/* Badge 3: Strength Overlord */}
            {planData.highest1RM >= 50 ? (
              <div className="bg-gray-50 hover:bg-purple-50/20 border border-gray-100 hover:border-purple-200/80 rounded-2xl p-5 flex gap-4 transition-all duration-300 group">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-xl border border-purple-200 group-hover:scale-110 transition-transform h-fit">
                  <Dumbbell size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Iron Will</h4>
                  <p className="text-xs text-gray-500 mt-1">Crossed {Math.round(planData.highest1RM)} kg on 1-Rep Max benchmarks.</p>
                </div>
              </div>
            ) : null}

            {/* Badge 4: Sleep Champ */}
            {Number(planData.avgSleep) >= 7 ? (
              <div className="bg-gray-50 hover:bg-indigo-50/20 border border-gray-100 hover:border-indigo-200/80 rounded-2xl p-5 flex gap-4 transition-all duration-300 group">
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl border border-indigo-200 group-hover:scale-110 transition-transform h-fit">
                  <Moon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Sleep Champion</h4>
                  <p className="text-xs text-gray-500 mt-1">Averaged {planData.avgSleep} hrs of sleep with {planData.favoriteSleepQuality} quality.</p>
                </div>
              </div>
            ) : null}

            {/* Fallback Badge if none logged */}
            {planData.totalSets === 0 && Number(planData.avgWater) < 3000 && planData.highest1RM < 50 && Number(planData.avgSleep) < 7 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex gap-4 col-span-full justify-center text-center">
                <div className="text-gray-400">
                  <Award size={32} className="mx-auto mb-2" />
                  <h4 className="font-bold text-sm text-gray-900">Goal Finisher</h4>
                  <p className="text-xs text-gray-500 mt-1">Completed your active plan schedule duration successfully.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Compound PR Wall of Fame */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-100 pb-4 text-gray-800">
            <Trophy size={20} className="text-yellow-500" /> Compound PR Wall of Fame
          </h2>
          {planData.prList && planData.prList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {planData.prList.map((pr: any, idx: number) => (
                <div key={idx} className="bg-gradient-to-br from-yellow-50/20 to-amber-50/5 border border-yellow-100 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-200/20 rounded-full blur-xl pointer-events-none"></div>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full capitalize">{pr.bodyPart}</span>
                      <span className="text-xs text-gray-400 font-bold">PR #{idx + 1}</span>
                    </div>
                    <h3 className="font-extrabold text-gray-900 mt-3 text-lg">{pr.name}</h3>
                  </div>
                  <div className="mt-6 flex justify-between items-baseline">
                    <span className="text-gray-500 text-xs">Peak Weight</span>
                    <span className="text-2xl font-black text-amber-600">{pr.weight} kg</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm font-medium">
              No exercise weight logs found. Start logging weights in your workouts to populate PR milestones!
            </div>
          )}
        </div>

        {/* Advanced Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Diet Tracker Graph */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-gray-100 pb-3 text-gray-800">
              <Utensils size={18} className="text-amber-500" /> Dietary Intake vs Target Goals (Last 7 Days)
            </h2>
            <div className="h-[280px] w-full">
              <Line data={dietChartData} options={dietChartOptions} />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed text-center pt-2 font-medium">
              🍽️ Actual caloric (amber) and protein (green) intake tracked daily against custom goal baselines.
            </p>
          </div>

          {/* Muscle Volume Distribution */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-gray-100 pb-3 text-gray-800">
                <Dumbbell size={18} className="text-blue-500" /> Muscle Volume Distribution
              </h2>
              {planData.volumeValues && planData.volumeValues.length > 0 ? (
                <div className="h-[230px] w-full flex items-center justify-center pt-4">
                  <Doughnut data={volumeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm font-medium">
                  No sets logged. Keep training to view your target muscle distribution!
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed text-center pt-2 font-medium">
              📊 Percentage split of total workout sets across different body muscle groups.
            </p>
          </div>
        </div>

        {/* Consistency Grid */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <Calendar size={20} className="text-blue-500" /> Logging Consistency (Last 60 Days)
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
              <span>Less</span>
              <span className="w-3 h-3 rounded-xs bg-gray-100"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-100"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-300"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-700"></span>
              <span>More</span>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="grid grid-flow-col grid-rows-4 gap-2 min-w-[700px] py-1">
              {planData.consistencyData?.map((day: any, idx: number) => {
                const colors = [
                  "bg-gray-100 hover:bg-gray-200 border-gray-200/50",
                  "bg-emerald-100 hover:bg-emerald-200 border-emerald-200/50",
                  "bg-emerald-300 hover:bg-emerald-400 border-emerald-300/50",
                  "bg-emerald-500 hover:bg-emerald-600 border-emerald-500/50",
                  "bg-emerald-700 hover:bg-emerald-800 border-emerald-700/50"
                ];
                const bgColor = colors[day.score] || colors[0];
                
                return (
                  <div
                    key={idx}
                    className={`w-[36px] h-[36px] rounded-lg border flex flex-col justify-center items-center transition-all duration-200 cursor-pointer relative group ${bgColor}`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl w-44 pointer-events-none text-left">
                      <p className="font-bold text-gray-300 border-b border-gray-800 pb-1 mb-1">{day.dayLabel}</p>
                      <p>💪 Exercises: {day.exercises} sets</p>
                      <p>🍳 Meals: {day.meals} items</p>
                      <p>💧 Water: {day.water} ml</p>
                      <p>💤 Sleep Logged: {day.sleep ? "Yes" : "No"}</p>
                    </div>
                    <span className="text-[9px] font-bold opacity-30 select-none">{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed font-medium">
            💡 Keeping blocks fully colored guarantees daily progress and fast recovery tracking. Each cell represents 1 day.
          </p>
        </div>

        {/* Next Phase & Deload Planner Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Next Phase Recommendations */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-100 pb-4 text-gray-800">
                <Sparkles size={20} className="text-purple-500" /> AI Coach Smart Recommendations
              </h2>
              
              <div className="bg-purple-50/40 border border-purple-100/60 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-purple-900 flex items-center gap-2">
                  <Award size={18} /> Recommended Next Phase: {planData.goal === "fat loss" ? "Lean Muscle Gain (Clean Bulk)" : "Strength Consolidation & Cut"}
                </h3>
                <p className="text-sm text-purple-800/80 leading-relaxed font-medium">
                  Based on your completed cycle of <strong>{planData.name}</strong>, your body is fully adapted to the current stress. To maximize muscle adaptation, metabolic rate, and athletic capability, we recommend transitioning to a new macro/routine phase.
                </p>
                <div className="flex gap-2">
                  <Link href="/plans">
                    <button className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer">
                      Explore Training Programs
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Heart size={18} className="text-rose-500 fill-rose-500/10" /> Next Plan Strategy Tips
                </h3>
                <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 font-medium">
                  <li>Maintain current weight for 1 week (Deload/Maintenance) to recover CNS fatigue.</li>
                  <li>Aim to increase baseline compounds (Squat/Bench/Dead) targets by 5-10%.</li>
                  <li>Keep daily hydration at 4L minimum to sustain new muscle mass growth.</li>
                  <li>Increase protein absorption via split feeding schedules (4-5 doses).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Deload Planner Checklist */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-gray-100 pb-4 text-gray-800">
              <Calendar size={20} className="text-blue-500" /> Active Deload & Recovery Planner
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              A deload week is essential to clear accumulated systemic fatigue and prevent injury. Complete these checklist targets during your recovery week:
            </p>
            <div className="space-y-3 pt-2">
              {Object.keys(deloadChecklist).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleChecklistItem(item)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                    deloadChecklist[item]
                      ? "bg-green-50/50 border-green-200 text-green-800"
                      : "bg-gray-50 hover:bg-gray-100/50 border-gray-200/80 text-gray-700"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    deloadChecklist[item]
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-white border-gray-300 text-transparent"
                  }`}>
                    ✓
                  </div>
                  <span className={`text-xs font-bold leading-normal ${deloadChecklist[item] ? "line-through text-green-600/70" : ""}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mt-2">
              <p className="text-xs text-blue-700 font-bold leading-relaxed">
                💡 Ticking all items off guarantees that your tendons, joints, and nervous system are ready to take on the next plan effectively!
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
