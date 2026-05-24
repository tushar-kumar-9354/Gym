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
} from "chart.js";
import { BarChart2, PieChart, TrendingUp, Droplet, Dumbbell, Coffee, Sparkles, Target, Moon } from "lucide-react";
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
  Legend
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

        </div>
      )}
    </div>
  );
}
