"use client";

import React, { useState } from "react";
import StrengthChart from "@/components/charts/StrengthChart";
import { Plus, Target, Info } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

export default function StrengthTracker() {
  const [exercise, setExercise] = useState("Bench Press");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const exercises = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Pull-ups"];
  
  // Dummy data
  const dates = ["May 1", "May 5", "May 10", "May 15", "May 18"];
  const oneRMs = [70, 72.5, 75, 75, 78]; // Simulated progression
  
  const current1RM = 78;
  const target1RM = 90;

  const handleAddSet = (e: React.FormEvent) => {
    e.preventDefault();
    // Epley formula: weight × (1 + reps/30)
    // Add logic here to store and calculate
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold">Strength Tracker</h1>
        <p className="text-gray-400 mt-1">Log your lifts and monitor your 1 Rep Max progression.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form & Progress */}
        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gradient inline-block">Log a Set</h2>
            
            <form onSubmit={handleAddSet} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Exercise</label>
                <select 
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent-500 transition-colors appearance-none"
                >
                  {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Reps</label>
                  <input 
                    type="number" 
                    min="1"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-accent-600 hover:bg-accent-500 text-white py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
              >
                <Plus size={20} /> Add Set
              </button>
            </form>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-accent-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="text-accent-500" /> Goal Tracker
            </h2>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-400">Current 1RM: <strong className="text-white">{current1RM} kg</strong></span>
              <span className="text-gray-400">Target: <strong className="text-white">{target1RM} kg</strong></span>
            </div>
            <ProgressBar label="Goal Completion" progress={(current1RM / target1RM) * 100} colorClass="bg-accent-500" showText={false} />
            <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
              <Info size={14} className="mt-0.5" />
              1RM is calculated using the Epley formula: weight × (1 + reps/30)
            </p>
          </section>
        </div>

        {/* Right Column: Chart & History */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">1RM Progression</h2>
              <div className="text-sm px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-gray-300">
                {exercise}
              </div>
            </div>
            <StrengthChart dates={dates} oneRMs={oneRMs} exerciseName={exercise} />
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Recent History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-gray-400 text-sm">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Weight</th>
                    <th className="pb-3 font-medium">Reps</th>
                    <th className="pb-3 font-medium">Est. 1RM</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 text-gray-300">Today, 10:45 AM</td>
                    <td className="py-3 font-medium text-white">65 kg</td>
                    <td className="py-3 font-medium text-white">6</td>
                    <td className="py-3 font-bold text-accent-400">78.0 kg</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 text-gray-300">May 15, 6:00 PM</td>
                    <td className="py-3 font-medium text-white">60 kg</td>
                    <td className="py-3 font-medium text-white">8</td>
                    <td className="py-3 font-bold text-accent-400">76.0 kg</td>
                  </tr>
                  <tr className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 text-gray-300">May 10, 7:15 AM</td>
                    <td className="py-3 font-medium text-white">60 kg</td>
                    <td className="py-3 font-medium text-white">7</td>
                    <td className="py-3 font-bold text-accent-400">74.0 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
