"use client";

import React, { useState, useEffect } from "react";
import { Line, Bar, Doughnut, PolarArea, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { BarChart2, PieChart, TrendingUp, Droplet, Dumbbell, Coffee, Sparkles, Target, Moon, Ruler } from "lucide-react";
import { getExerciseTrackingType, formatExerciseValue } from "@/utils/oneRM";
import { getHydrationTarget } from "@/lib/planTargets";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Visualise() {
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [weeklyWeights, setWeeklyWeights] = useState<any[]>([]);
  const [waterIntake, setWaterIntake] = useState<{ [key: string]: number }>({});
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [sleepLogs, setSleepLogs] = useState<{ [key: string]: { hours: number; quality: string } }>({});

  // Body Metrics History
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState("chest");
  const [chartUnit, setChartUnit] = useState<"cm" | "in">("cm");

  // Plan Details
  const [goalWeight, setGoalWeight] = useState(75);
  const [startWeight, setStartWeight] = useState(80);
  const [currentWeight, setCurrentWeight] = useState(80);
  const [goal, setGoal] = useState("General Fitness");
  const [activityLevel, setActivityLevel] = useState("moderate");

  // Strength Chart States
  const [selectedBodyPart, setSelectedBodyPart] = useState("Chest");
  const [selectedExercise, setSelectedExercise] = useState("Bench Press");
  const [customExerciseDB, setCustomExerciseDB] = useState<{ [key: string]: string[] }>({});

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

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email && plan) {
      const logs = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
      setExerciseLogs(logs);

      const meals = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
      setLoggedMeals(meals);

      const weights = JSON.parse(localStorage.getItem(`${email}_${plan}_weeklyWeights`) || "[]");
      setWeeklyWeights(weights);

      const water = JSON.parse(localStorage.getItem(`${email}_${plan}_waterIntake`) || "{}");
      setWaterIntake(water);

      const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
      const currentPlan = plans.find((p: any) => p.name === plan);
      if (currentPlan) {
        setStartWeight(currentPlan.weight);
        setGoalWeight(currentPlan.goalWeight);
        setCurrentWeight(currentPlan.weight); // Fallback
        setGoal(currentPlan.goal || "General Fitness");
        setActivityLevel(currentPlan.activityLevel || "moderate");
      }

      const savedCustomEx = JSON.parse(localStorage.getItem(`${email}_customExercises`) || "{}");
      setCustomExerciseDB(savedCustomEx);

      const reports = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || "[]");
      setDailyReports(reports);

      const slpLogs = JSON.parse(localStorage.getItem(`${email}_${plan}_sleepLogs`) || "{}");
      setSleepLogs(slpLogs);
    }

    // Load body metrics history - prefer plan-scoped history when active
    if (email) {
      const planKey = plan ? `${email}_${plan}_metricsHistory` : null;
      const fallbackKey = `${email}_metricsHistory`;
      const mHistory = JSON.parse(localStorage.getItem(planKey || fallbackKey) || "[]");
      setMetricsHistory(mHistory);
    }
  }, []);

  const getAvailableExercises = (part: string) => {
    const defaults = defaultExerciseDatabase[part] || [];
    const customs = customExerciseDB[part] || [];
    return [...defaults, ...customs];
  };

  const handleBodyPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const part = e.target.value;
    setSelectedBodyPart(part);
    const available = getAvailableExercises(part);
    setSelectedExercise(available[0] || "");
  };

  const waterTarget = getHydrationTarget(currentWeight, goal, activityLevel);

  // 1. Process Weight Data (with Target Baseline)
  const weightDates = weeklyWeights.map(w => new Date(w.date).toLocaleDateString('en-US'));
  const weightValues = weeklyWeights.map(w => w.weight);

  const weightData = {
    labels: weightDates.length > 0 ? weightDates : ["No Data"],
    datasets: [
      {
        label: "Weight (kg)",
        data: weightValues.length > 0 ? weightValues : [0],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        fill: true,
      },
      {
        label: `Target (${goalWeight} kg)`,
        data: Array(weightDates.length > 0 ? weightDates.length : 1).fill(goalWeight),
        borderColor: "#93c5fd",
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  // 2. Process Nutrition Data (Doughnut)
  const totalMacros = loggedMeals.reduce((acc, meal) => ({
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fat: acc.fat + (meal.fat || 0),
  }), { protein: 0, carbs: 0, fat: 0 });

  const totalMacroSum = totalMacros.protein + totalMacros.carbs + totalMacros.fat;
  const macroData = {
    labels: ["Protein", "Carbs", "Fat"],
    datasets: [
      {
        data: totalMacroSum > 0 ? [totalMacros.protein, totalMacros.carbs, totalMacros.fat] : [1, 1, 1],
        backgroundColor: ["#3b82f6", "#60a5fa", "#93c5fd"],
        borderWidth: 1,
      },
    ],
  };

  // 3. Calorie Adherence (Bar) - Last 7 days (dynamically based on the latest logged date, supporting future days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    let latestLogDate = new Date();

    // Check meals
    loggedMeals.forEach((m: any) => {
      const d = new Date(m.date);
      if (d > latestLogDate) latestLogDate = d;
    });

    // Check exercises
    exerciseLogs.forEach((e: any) => {
      const d = new Date(e.date);
      if (d > latestLogDate) latestLogDate = d;
    });

    // Check weights
    weeklyWeights.forEach((w: any) => {
      const d = new Date(w.date);
      if (d > latestLogDate) latestLogDate = d;
    });

    // Check water
    Object.keys(waterIntake).forEach((dateStr: string) => {
      const d = new Date(dateStr);
      if (d > latestLogDate) latestLogDate = d;
    });

    // Check sleep
    Object.keys(sleepLogs).forEach((dateStr: string) => {
      const d = new Date(dateStr);
      if (d > latestLogDate) latestLogDate = d;
    });

    const d = new Date(latestLogDate);
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const calData = last7Days.map(date => {
    const dayMeals = loggedMeals.filter(m => new Date(m.date).toISOString().split('T')[0] === date);
    return dayMeals.reduce((sum, m) => sum + m.calories, 0);
  });

  const adherenceData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: "Calories Consumed",
        data: calData,
        backgroundColor: "#3b82f6",
        borderRadius: 5,
      },
      {
        label: "Target (2200 kcal)",
        data: Array(7).fill(2200),
        borderColor: "#93c5fd",
        borderDash: [5, 5],
        borderWidth: 2,
        type: "line" as const,
        fill: false,
        pointRadius: 0,
      },
    ] as any[],
  };

  // 4. Exercise Body Part Distribution (Polar Area)
  const bodyPartCounts: { [key: string]: number } = {};
  exerciseLogs.forEach(log => {
    bodyPartCounts[log.bodyPart] = (bodyPartCounts[log.bodyPart] || 0) + 1;
  });

  const polarData = {
    labels: Object.keys(bodyPartCounts).length > 0 ? Object.keys(bodyPartCounts) : ["None"],
    datasets: [
      {
        data: Object.keys(bodyPartCounts).length > 0 ? Object.values(bodyPartCounts) : [1],
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(96, 165, 250, 0.7)",
          "rgba(147, 197, 253, 0.7)",
          "rgba(191, 219, 254, 0.7)",
          "rgba(219, 234, 254, 0.7)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // 5. Water Intake Trend (Line with Target Baseline)
  const waterData = last7Days.map(date => waterIntake[date] || 0);
  const waterTrendData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: "Water Intake (ml)",
        data: waterData,
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
      {
        label: `Target (${waterTarget}ml)`,
        data: Array(7).fill(waterTarget),
        borderColor: "#93c5fd",
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  // 6. Most Common Diet (Horizontal Bar)
  const foodFrequencies: { [key: string]: number } = {};
  loggedMeals.forEach(meal => {
    foodFrequencies[meal.name] = (foodFrequencies[meal.name] || 0) + 1;
  });

  const topFoods = Object.entries(foodFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topFoodNames = topFoods.map(f => f[0]);
  const topFoodCounts = topFoods.map(f => f[1]);

  const commonDietData = {
    labels: topFoodNames.length > 0 ? topFoodNames : ["No Food Logged"],
    datasets: [
      {
        label: "Times Eaten",
        data: topFoodCounts.length > 0 ? topFoodCounts : [0],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 5,
      },
    ],
  };

  // Find the top food details for macro/micro
  const topFoodName = topFoodNames[0] || "None";
  const topFoodDetails = loggedMeals.find(m => m.name === topFoodName) || { protein: 0, carbs: 0, fat: 0 };

  const topFoodMacroData = {
    labels: ["Protein", "Carbs", "Fat"],
    datasets: [
      {
        label: `Macros for ${topFoodName}`,
        data: [topFoodDetails.protein, topFoodDetails.carbs, topFoodDetails.fat],
        backgroundColor: ["#3b82f6", "#60a5fa", "#93c5fd"],
        borderWidth: 1,
      },
    ],
  };

  const mockMicroData = {
    labels: ["Vitamin A", "Vitamin C", "Iron", "Calcium", "Zinc", "B12"],
    datasets: [
      {
        label: `Daily Value % in ${topFoodName}`,
        data: topFoodName !== "None" ? [35, 12, 45, 20, 15, 30] : [0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(96, 165, 250, 0.2)",
        borderColor: "#3b82f6",
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
      },
    ],
  };

  // 7. NEW: Strength Trajectory (Inline implementation for full control)
  const filteredLogs = exerciseLogs.filter(log => log.exercise === selectedExercise);
  const strengthDates = filteredLogs.map(log => new Date(log.date).toLocaleDateString('en-US'));
  const strengthValues = filteredLogs.map(log => log.oneRM);

  const trackingType = getExerciseTrackingType(selectedExercise, selectedBodyPart);
  const strengthLabel = trackingType === "Time" ? `Max Duration (s)` : trackingType === "Reps" ? `Max Reps` : `1RM (kg)`;

  const strengthData = {
    labels: strengthDates.length > 0 ? strengthDates : ["No Data"],
    datasets: [
      {
        label: `${strengthLabel} for ${selectedExercise}`,
        data: strengthValues.length > 0 ? strengthValues : [0],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        fill: true,
      },
    ],
  };

  const strengthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: { color: "#6b7280", font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const val = context.raw;
            if (trackingType === "Time") {
              return `Max Duration: ${formatExerciseValue(val, "Time")}`;
            } else if (trackingType === "Reps") {
              return `Max Reps: ${formatExerciseValue(val, "Reps")}`;
            } else {
              return `Estimated 1RM: ${val} kg`;
            }
          },
        },
      },
    },
    scales: {
      y: {
        grid: { color: "#f3f4f6" },
        ticks: {
          color: "#9ca3af",
          callback: function (value: any) {
            if (trackingType === "Time") {
              return formatExerciseValue(value, "Time");
            } else if (trackingType === "Reps") {
              return formatExerciseValue(value, "Reps");
            } else {
              return `${value} kg`;
            }
          },
        },
      },
      x: { grid: { display: false }, ticks: { color: "#9ca3af" } },
    },
  };

  // 8. Daily Score Trend (last 7 days from dailyReports)
  const scoreByDate: { [key: string]: number } = {};
  dailyReports.forEach(r => {
    try {
      const key = r && r.date ? new Date(r.date).toISOString().split('T')[0] : null;
      if (key) scoreByDate[key] = typeof r.score === 'number' ? r.score : Number(r.score) || 0;
    } catch (e) {
      // ignore malformed dates
    }
  });
  const scoreTrendData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: "Daily Score (%)",
        data: last7Days.map(d => scoreByDate[d] ?? 0),
        backgroundColor: last7Days.map(d => (scoreByDate[d] ?? 0) >= 80 ? "#22c55e" : (scoreByDate[d] ?? 0) >= 50 ? "#eab308" : "#f87171"),
        borderRadius: 6,
      },
    ] as any[],
  };

  // 9. Sleep Trend (last 7 days)
  const sleepTrendData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: "Hours Slept",
        data: last7Days.map(d => {
          const s = sleepLogs[d];
          if (!s) return null;
          if (Array.isArray(s)) return s.reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
          return s.hours ?? null;
        }),
        borderColor: "#a855f7",
        backgroundColor: "rgba(168,85,247,0.15)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        spanGaps: true,
      },
      {
        label: "Target (8h)",
        data: Array(7).fill(8),
        borderColor: "#d8b4fe",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ] as any[],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: { color: "#6b7280", font: { size: 11 } },
      },
    },
    scales: {
      y: { grid: { color: "#f3f4f6" }, ticks: { color: "#9ca3af" } },
      x: { grid: { display: false }, ticks: { color: "#9ca3af" } },
    },
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen pb-12 pt-24 w-full">
      <header className="w-full flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Visualisation Hub</h1>
          <p className="text-gray-500 mt-1">A deep graphical look into your fitness journey with target baselines.</p>
        </div>
        {activePlan && (
          <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
            <span className="font-bold text-blue-500">Plan: {activePlan}</span>
          </div>
        )}
      </header>

      {!activePlan ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-50 text-center w-full">
          <p className="text-gray-500">Please select or create a plan first to view visualizations.</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Chart 1: Goal Trajectory (Weight) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Goal Trajectory (Weight Progress)</h2>
            </div>
            <div className="h-64">
              <Line data={weightData} options={options} />
            </div>
          </div>

          {/* Chart 2: Strength Trajectory */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="text-blue-500" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Strength Trajectory</h2>
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedBodyPart}
                  onChange={handleBodyPartChange}
                  className="bg-gray-50 border border-gray-100 rounded-2xl px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-gray-700"
                >
                  {Object.keys(defaultExerciseDatabase).map(part => <option key={part} value={part}>{part}</option>)}
                </select>
                <select 
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-2xl px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-gray-700"
                >
                  {getAvailableExercises(selectedBodyPart).map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
            </div>
            <div className="h-64">
              {filteredLogs.length > 0 ? (
                <Line data={strengthData} options={strengthOptions} />
              ) : (
                <div className="text-center py-20 text-gray-500 text-sm">No logs for this exercise yet.</div>
              )}
            </div>
          </div>

          {/* Chart 3: Calorie Adherence */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Calorie Adherence (Last 7 Days)</h2>
            </div>
            <div className="h-64">
              <Bar data={adherenceData} options={options} />
            </div>
          </div>

          {/* Chart 4: Water Intake */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Droplet className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Hydration Trend (Last 7 Days)</h2>
            </div>
            <div className="h-64">
              <Line data={waterTrendData} options={options} />
            </div>
          </div>

          {/* Chart 5: Most Common Diet */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Most Frequent Foods</h2>
            </div>
            <div className="h-64">
              <Bar data={commonDietData} options={{ ...options, indexAxis: 'y' as const }} />
            </div>
          </div>

          {/* Chart 6: Top Food Breakdown */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Top Food: {topFoodName}</h2>
            </div>
            <div className="h-64 flex gap-2">
              <div className="w-1/2">
                <Doughnut data={topFoodMacroData} options={{ ...options, scales: { x: { display: false }, y: { display: false } } }} />
              </div>
              <div className="w-1/2">
                <Radar data={mockMicroData} options={{ ...options, scales: { r: { angleLines: { color: "#f3f4f6" }, grid: { color: "#f3f4f6" }, pointLabels: { color: "#6b7280" }, ticks: { display: false } } } }} />
              </div>
            </div>
          </div>

          {/* Chart 7: Body Part Focus */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Workout Focus (By Body Part)</h2>
            </div>
            <div className="h-64 flex justify-center">
              <PolarArea data={polarData} options={{ ...options, scales: { r: { grid: { color: "#f3f4f6" }, ticks: { display: false } } } }} />
            </div>
          </div>

          {/* Chart 8: Daily Score Trend */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Daily Score Trend (Last 7 Days)</h2>
            </div>
            <div className="h-64">
              <Bar data={scoreTrendData} options={options} />
            </div>
          </div>

          {/* Chart 9: Sleep Trend */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="text-purple-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Sleep Trend (Last 7 Days)</h2>
            </div>
            <div className="h-64">
              <Line data={sleepTrendData} options={options} />
            </div>
          </div>

          {/* Chart 10: Body Metrics Progress */}
          {(() => {
            const metricLabels: Record<string, string> = {
              chest: "Chest",
              waist: "Waist",
              bicepsLeft: "Biceps (Left)",
              bicepsRight: "Biceps (Right)",
              forearmLeft: "Forearm (Left)",
              forearmRight: "Forearm (Right)",
              shoulderWidth: "Shoulders",
              thighLeft: "Thigh (Left)",
              thighRight: "Thigh (Right)",
              calfLeft: "Calf (Left)",
              calfRight: "Calf (Right)",
            };

            const convertToUnit = (cmVal: number) => {
              if (chartUnit === "cm") return cmVal;
              return parseFloat((cmVal / 2.54).toFixed(1));
            };

            // Group history entries by granular date-time if there are multiple entries in the same month (for testing)
            const monthlySnapshots: { month: string; value: number }[] = [];
            const hasMultipleInSameMonth = (() => {
              const months = metricsHistory.map((s: any) => s.date ? s.date.slice(0, 7) : "");
              const uniqueMonths = new Set(months.filter(Boolean));
              return metricsHistory.length > uniqueMonths.size;
            })();

            if (hasMultipleInSameMonth) {
              // Detailed testing mode: show all snapshots with time
              metricsHistory.forEach((snap: any) => {
                if (!snap.date || !snap.bodyMetricsCm) return;
                const val = parseFloat(snap.bodyMetricsCm?.[selectedMetric] || "0");
                if (val > 0) {
                  const formattedLabel = new Date(snap.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  monthlySnapshots.push({ month: formattedLabel, value: val });
                }
              });
            } else {
              // Normal monthly mode
              const byMonth: Record<string, any> = {};
              metricsHistory.forEach((snap: any) => {
                if (!snap.date || !snap.bodyMetricsCm) return;
                const monthKey = snap.date.slice(0, 7); // YYYY-MM
                byMonth[monthKey] = snap;
              });
              const sortedMonths = Object.keys(byMonth).sort();
              sortedMonths.forEach(m => {
                const val = parseFloat(byMonth[m].bodyMetricsCm?.[selectedMetric] || "0");
                if (val > 0) {
                  const [y, mm] = m.split("-");
                  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const label = `${monthNames[parseInt(mm) - 1]} ${y}`;
                  monthlySnapshots.push({ month: label, value: val });
                }
              });
            }

            const labels = monthlySnapshots.map(s => s.month);
            const values = monthlySnapshots.map(s => convertToUnit(s.value));

            const firstVal = values.length > 0 ? values[0] : 0;
            const lastVal = values.length > 0 ? values[values.length - 1] : 0;
            const changeCm = lastVal - firstVal;
            const changePercent = firstVal > 0 ? ((changeCm / firstVal) * 100).toFixed(1) : "0.0";
            const isGain = changeCm > 0;

            const metricColors: Record<string, { border: string; bg: string }> = {
              chest: { border: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
              waist: { border: "#ef4444", bg: "rgba(239,68,68,0.12)" },
              bicepsLeft: { border: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
              bicepsRight: { border: "#a855f7", bg: "rgba(168,85,247,0.12)" },
              forearmLeft: { border: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
              forearmRight: { border: "#0891b2", bg: "rgba(8,145,178,0.12)" },
              shoulderWidth: { border: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
              thighLeft: { border: "#10b981", bg: "rgba(16,185,129,0.12)" },
              thighRight: { border: "#059669", bg: "rgba(5,150,105,0.12)" },
              calfLeft: { border: "#f97316", bg: "rgba(249,115,22,0.12)" },
              calfRight: { border: "#ea580c", bg: "rgba(234,88,12,0.12)" },
            };
            const color = metricColors[selectedMetric] || metricColors.chest;

            const metricsChartData = {
              labels: labels.length > 0 ? labels : ["No Data"],
              datasets: [
                {
                  label: `${metricLabels[selectedMetric] || selectedMetric} (${chartUnit})`,
                  data: values.length > 0 ? values : [0],
                  borderColor: color.border,
                  backgroundColor: color.bg,
                  borderWidth: 3,
                  tension: 0.35,
                  pointRadius: 6,
                  pointBackgroundColor: color.border,
                  pointBorderColor: "#fff",
                  pointBorderWidth: 2,
                  pointHoverRadius: 8,
                  fill: true,
                },
              ],
            };

            const metricsChartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: "top" as const,
                  labels: { color: "#6b7280", font: { size: 12, weight: "bold" as const }, usePointStyle: true },
                },
                tooltip: {
                  backgroundColor: "rgba(17,24,39,0.9)",
                  titleColor: "#fff",
                  bodyColor: "#d1d5db",
                  padding: 12,
                  cornerRadius: 10,
                  callbacks: {
                    label: function (context: any) {
                      return `${context.dataset.label}: ${context.raw} ${chartUnit}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  grid: { color: "#f3f4f6" },
                  ticks: { color: "#9ca3af", callback: (v: any) => `${v} ${chartUnit}` },
                },
                x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
              },
            };

            return (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 md:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <Ruler className="text-indigo-500" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">Body Metrics Progress</h2>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={chartUnit}
                      onChange={(e) => setChartUnit(e.target.value as "cm" | "in")}
                      className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-gray-700"
                    >
                      <option value="cm">Centimeters (cm)</option>
                      <option value="in">Inches (in)</option>
                    </select>
                    <select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-gray-700"
                    >
                      {Object.entries(metricLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Change Summary Cards */}
                {values.length >= 2 && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">First Record</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{firstVal} {chartUnit}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Latest</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{lastVal} {chartUnit}</p>
                    </div>
                    <div className={`p-3 rounded-xl text-center ${isGain ? "bg-green-50" : "bg-red-50"}`}>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Change</p>
                      <p className={`text-lg font-bold mt-1 ${isGain ? "text-green-600" : "text-red-600"}`}>
                        {isGain ? "+" : ""}{changeCm.toFixed(1)} {chartUnit}
                      </p>
                      <p className={`text-xs ${isGain ? "text-green-500" : "text-red-500"}`}>
                        ({isGain ? "+" : ""}{changePercent}%)
                      </p>
                    </div>
                  </div>
                )}

                <div className="h-72">
                  {monthlySnapshots.length > 0 ? (
                    <Line data={metricsChartData} options={metricsChartOptions} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Ruler size={40} className="mb-3 text-gray-300" />
                      <p className="text-sm font-medium">No body metrics history yet.</p>
                      <p className="text-xs mt-1">Save your measurements on the Metrics page to see progress here.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}
