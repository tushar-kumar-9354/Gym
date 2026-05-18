"use client";

import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { Plus, Target, Calendar, Edit2, CheckCircle2 } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

export default function GoalsTracker() {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Dummy weight progression data
  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Actual Weight (kg)",
        data: [82, 81.5, 81.2, 80.5, 80.0, 79.5],
        borderColor: "#10b981", // Success green
        backgroundColor: "transparent",
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: "#10b981",
      },
      {
        label: "Target Trend",
        data: [82, 81, 80, 79, 78, 77],
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Goals & Body Progress</h1>
          <p className="text-gray-400 mt-1">Manage your active plans and log your weight.</p>
        </div>
        <button className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-white px-4 py-2 rounded-xl flex items-center gap-2 border border-[var(--color-border)] transition-colors">
          <Edit2 size={16} /> Edit Plan
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-2xl border border-primary-500/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gradient inline-block">Active Plan</h2>
                <h3 className="text-2xl font-bold mt-1 text-white">Summer Cut</h3>
              </div>
              <span className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-xs font-medium">
                3 Months
              </span>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-gray-400">Start Date</span>
                <span className="font-medium">April 1, 2026</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-gray-400">End Date</span>
                <span className="font-medium text-warning">July 1, 2026</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2">
                <span className="text-gray-400">Target Weight</span>
                <span className="font-bold text-success">72 kg</span>
              </div>
            </div>

            <div className="mt-6">
              <ProgressBar label="Plan Completion (Days)" progress={45} colorClass="bg-primary-500" />
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Log Weight</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 78.5"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <button 
                type="button"
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
              <div className="bg-success/10 border border-success/20 p-4 rounded-xl flex gap-3">
                <CheckCircle2 className="text-success shrink-0" />
                <div>
                  <h4 className="font-semibold text-white">Under 80kg</h4>
                  <p className="text-xs text-success mt-1">Reached on May 15, 2026</p>
                </div>
              </div>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl flex gap-3 opacity-50">
                <div className="w-6 h-6 rounded-full border-2 border-gray-600 shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-400">Reach 75kg</h4>
                  <p className="text-xs text-gray-500 mt-1">Projected: June 10, 2026</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
