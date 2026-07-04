"use client";

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Plus, Target, Calendar, Edit2, CheckCircle2 } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GoalsTracker() {
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [weeklyWeights, setWeeklyWeights] = useState<{ date: string; weight: number }[]>([]);

  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");

  // Initialize date to local date string (YYYY-MM-DD)
  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
    setSavedPlans(plans);

    if (email && plan) {
      const current = plans.find((p: any) => p.name === plan);
      setCurrentPlan(current);

      const weights = JSON.parse(localStorage.getItem(`${email}_${plan}_weeklyWeights`) || "[]");
      setWeeklyWeights(weights);
    }
  }, []);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !activePlan) {
      alert("No active plan found. Please create/activate a plan first.");
      return;
    }

    const weightVal = parseFloat(weight);
    if (isNaN(weightVal) || weightVal <= 0) {
      alert("Please enter a valid weight.");
      return;
    }

    if (!date) {
      alert("Please select a date.");
      return;
    }

    // Save to localStorage
    const existingIndex = weeklyWeights.findIndex((entry) => entry.date === date);
    let updatedWeights = [];
    if (existingIndex >= 0) {
      updatedWeights = weeklyWeights.map((entry, idx) => idx === existingIndex ? { ...entry, weight: weightVal } : entry);
    } else {
      updatedWeights = [...weeklyWeights, { date, weight: weightVal }];
    }

    // Sort by date
    updatedWeights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    localStorage.setItem(`${userEmail}_${activePlan}_weeklyWeights`, JSON.stringify(updatedWeights));
    setWeeklyWeights(updatedWeights);
    setWeight("");
    alert("Weight logged successfully!");

    // Dispatch custom event to notify other components (like dashboard)
    window.dispatchEvent(new Event("gym-plan-updated"));
  };

  const planStart = currentPlan?.startDate || currentPlan?.date || new Date().toISOString();
  const planStartObj = new Date(planStart);
  
  const startW = currentPlan?.weight || 80;
  const goalW = currentPlan?.goalWeight || 75;
  const planDur = currentPlan?.duration || 3;
  const totalDays = planDur * 30;

  const sortedWeights = [...weeklyWeights]
    .filter(w => w && w.date && typeof w.weight === "number" && Number.isFinite(w.weight))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Build dynamic chart labels and data
  const chartLabels: string[] = [];
  const actualData: (number | null)[] = [];
  const targetData: number[] = [];

  // Add Start Point
  chartLabels.push(planStartObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  actualData.push(startW);
  targetData.push(startW);

  // Add all logged weight entries
  sortedWeights.forEach((entry) => {
    const entryDate = new Date(entry.date);
    chartLabels.push(entryDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    actualData.push(entry.weight);
    
    const diffTime = Math.max(0, entryDate.getTime() - planStartObj.getTime());
    const daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const expected = startW - ((startW - goalW) * (daysSinceStart / Math.max(1, totalDays)));
    targetData.push(parseFloat(expected.toFixed(1)));
  });

  // Append plan end point to show clean trajectory if needed
  const planEndObj = new Date(planStartObj);
  planEndObj.setMonth(planEndObj.getMonth() + planDur);

  if (sortedWeights.length === 0) {
    chartLabels.push(planEndObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    actualData.push(null);
    targetData.push(goalW);
  } else {
    const lastEntryDate = new Date(sortedWeights[sortedWeights.length - 1].date);
    if (lastEntryDate < planEndObj) {
      chartLabels.push(planEndObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
      actualData.push(null);
      targetData.push(goalW);
    }
  }

  // Dynamic Milestones
  const halfwayWeight = (startW + goalW) / 2;
  const isLosing = startW > goalW;

  const halfwayEntry = sortedWeights.find((w) =>
    isLosing ? w.weight <= halfwayWeight : w.weight >= halfwayWeight
  );
  const goalEntry = sortedWeights.find((w) =>
    isLosing ? w.weight <= goalW : w.weight >= goalW
  );

  // Start Date string
  const startDateStr = currentPlan
    ? new Date(planStart).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // End Date string
  const endDateStr = currentPlan
    ? planEndObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Plan progress in days
  const completionProgress = (() => {
    if (!currentPlan) return 0;
    const start = planStartObj.getTime();
    const end = planEndObj.getTime();
    const total = end - start;
    if (total <= 0) return 0;
    const elapsed = Date.now() - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  })();

  // Chart configuration
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Actual Weight (kg)",
        data: actualData,
        borderColor: "#10b981", // Success green
        backgroundColor: "transparent",
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: "#10b981",
        spanGaps: true,
      },
      {
        label: "Target Trend",
        data: targetData,
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
        spanGaps: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#9ca3af" }
      }
    },
    scales: {
      x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#9ca3af" } },
      y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#9ca3af" } }
    }
  };

  if (!activePlan || !currentPlan) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold">Goals & Body Progress</h1>
        <p className="text-gray-400 mt-2">No active fitness plan found. Please configure a plan to set up goals.</p>
        <div className="mt-6">
          <Link href="/plans">
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl transition-colors font-medium">
              Create / Activate Plan
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Goals & Body Progress</h1>
          <p className="text-gray-400 mt-1">Manage your active plans and log your weight.</p>
        </div>
        <Link href="/plans">
          <button className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-white px-4 py-2 rounded-xl flex items-center gap-2 border border-[var(--color-border)] transition-colors">
            <Edit2 size={16} /> Edit Plan
          </button>
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-2xl border border-primary-500/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gradient inline-block">Active Plan</h2>
                <h3 className="text-2xl font-bold mt-1 text-white">{currentPlan.name}</h3>
              </div>
              <span className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-xs font-medium">
                {currentPlan.duration} Months
              </span>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-gray-400">Start Date</span>
                <span className="font-medium">{startDateStr}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-gray-400">End Date</span>
                <span className="font-medium text-warning">{endDateStr}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-gray-400">Target Weight</span>
                <span className="font-bold text-success">{goalW} kg</span>
              </div>
            </div>

            <div className="mt-6">
              <ProgressBar label="Plan Completion (Days)" progress={completionProgress} colorClass="bg-primary-500" />
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Log Weight</h2>
            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={`e.g. ${startW}`}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-success hover:bg-emerald-600 text-white py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Save Entry
              </button>
            </form>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Target className="text-success" /> Weight Trajectory
            </h2>
            <div className="h-80 w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Milestones Reached</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Halfway Milestone */}
              <div className={`p-4 rounded-xl flex gap-3 border ${
                halfwayEntry 
                  ? "bg-success/10 border-success/20 text-success" 
                  : "bg-[var(--color-surface)] border-[var(--color-border)] opacity-50"
              }`}>
                {halfwayEntry ? (
                  <CheckCircle2 className="text-success shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-600 shrink-0"></div>
                )}
                <div>
                  <h4 className={`font-semibold ${halfwayEntry ? "text-white" : "text-gray-400"}`}>
                    Reach {halfwayWeight.toFixed(1)}kg (Halfway)
                  </h4>
                  <p className="text-xs mt-1">
                    {halfwayEntry 
                      ? `Reached on ${new Date(halfwayEntry.date).toLocaleDateString()}` 
                      : `Target: ${halfwayWeight.toFixed(1)}kg`
                    }
                  </p>
                </div>
              </div>

              {/* Final Goal Milestone */}
              <div className={`p-4 rounded-xl flex gap-3 border ${
                goalEntry 
                  ? "bg-success/10 border-success/20 text-success" 
                  : "bg-[var(--color-surface)] border-[var(--color-border)] opacity-50"
              }`}>
                {goalEntry ? (
                  <CheckCircle2 className="text-success shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-600 shrink-0"></div>
                )}
                <div>
                  <h4 className={`font-semibold ${goalEntry ? "text-white" : "text-gray-400"}`}>
                    Reach {goalW.toFixed(1)}kg (Final Goal)
                  </h4>
                  <p className="text-xs mt-1">
                    {goalEntry 
                      ? `Reached on ${new Date(goalEntry.date).toLocaleDateString()}` 
                      : `Target: ${goalW.toFixed(1)}kg`
                    }
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
