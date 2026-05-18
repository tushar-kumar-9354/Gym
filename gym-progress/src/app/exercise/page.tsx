"use client";

import React, { useState, useEffect, Suspense } from "react";
import StrengthChart from "@/components/charts/StrengthChart";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ExerciseContent() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");

  const [date, setDate] = useState<string>(urlDate || new Date().toISOString().split('T')[0]);
  const [bodyPart, setBodyPart] = useState("Chest");
  const [exercise, setExercise] = useState("Bench Press");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  
  // Filter state
  const [filter, setFilter] = useState("All");

  const exerciseDatabase: { [key: string]: string[] } = {
    Chest: ["Bench Press", "Incline Dumbbell Press", "Chest Flyes"],
    Back: ["Deadlift", "Pull-ups", "Bent Over Rows"],
    Legs: ["Squat", "Leg Press", "Calf Raises"],
    Shoulders: ["Overhead Press", "Lateral Raises"],
    Arms: ["Bicep Curls", "Tricep Pushdowns"],
  };

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email && plan) {
      const savedLogs = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
      setLogs(savedLogs);
    }
  }, []);

  const handleBodyPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const part = e.target.value;
    setBodyPart(part);
    setExercise(exerciseDatabase[part][0]); // Default to first exercise
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !reps || !userEmail || !activePlan) {
      alert("Please select a plan first!");
      return;
    }

    const oneRM = parseFloat(weight) * (1 + parseInt(reps) / 30);
    
    const newLog = {
      date: new Date(date).toISOString(),
      bodyPart,
      exercise,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      oneRM: Math.round(oneRM * 10) / 10,
    };

    const updatedLogs = [...logs, newLog];
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
    
    setWeight("");
    setReps("");
    alert(`Logged: I did ${bodyPart} today with ${exercise} for plan "${activePlan}"!`);
  };

  const handleRemoveLog = (index: number) => {
    if (!userEmail || !activePlan) return;
    const updated = logs.filter((_, i) => i !== index);
    setLogs(updated);
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updated));
  };

  // Filter logs for display
  const filteredDisplayLogs = logs.filter(log => {
    if (filter === "All") return true;
    
    const logDate = new Date(log.date).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (filter === "Today") return logDate === today;
    if (filter === "Yesterday") return logDate === yesterday;
    
    return log.bodyPart === filter;
  });

  // Filter logs for chart
  const chartLogs = logs.filter(l => l.exercise === exercise);
  const dates = chartLogs.map(l => new Date(l.date).toLocaleDateString());
  const oneRMs = chartLogs.map(l => l.oneRM);

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Daily Exercise</h1>
          <p className="text-gray-500 mt-1">Log your workouts and calculate your strength.</p>
        </div>
        <div className="flex items-center gap-3">
          {activePlan && (
            <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-medium text-blue-500">
              Plan: {activePlan}
            </div>
          )}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <Calendar size={18} className="text-gray-500" />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-gray-900 outline-none text-sm"
            />
          </div>
        </div>
      </header>

      {!activePlan ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500">Please select or create a plan first to track your exercises.</p>
          <Link href="/plans">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4">Go to Plans</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Log Workout</h2>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
                <select 
                  value={bodyPart}
                  onChange={handleBodyPartChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(exerciseDatabase).map(part => <option key={part} value={part}>{part}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
                <select 
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  {exerciseDatabase[bodyPart].map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 60"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                  <input 
                    type="number" 
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="e.g. 8"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={18} /> Add Set
              </button>
            </form>
          </div>

          {/* Chart & History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Strength Calculator (1RM)</h2>
                <span className="text-sm text-blue-500 font-medium">{exercise}</span>
              </div>
              <div className="h-64">
                {dates.length > 0 ? (
                  <StrengthChart dates={dates} oneRMs={oneRMs} exerciseName={exercise} />
                ) : (
                  <p className="text-gray-500 text-center py-20">No logs for this exercise yet. Add a set to see your 1RM progression!</p>
                )}
              </div>
            </div>

            {/* Better Organised Recent Workouts */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Workouts</h2>
                
                {/* Filter Bar */}
                <div className="flex flex-wrap gap-2">
                  {["All", "Today", "Yesterday", "Chest", "Back", "Legs"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        filter === f 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-sm">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Summary</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {filteredDisplayLogs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-500">No exercises found for this filter.</td>
                      </tr>
                    ) : (
                      filteredDisplayLogs.map((log, index) => {
                        const logDate = new Date(log.date).toISOString().split('T')[0];
                        const today = new Date().toISOString().split('T')[0];
                        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                        
                        const dateLabel = logDate === today ? "Today" : logDate === yesterday ? "Yesterday" : new Date(log.date).toLocaleDateString();
                        
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 flex items-center gap-1">
                              {logDate === today || logDate === yesterday ? (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${logDate === today ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-600'}`}>
                                  {dateLabel}
                                </span>
                              ) : (
                                <span className="text-gray-500 flex items-center gap-1"><Calendar size={12} /> {dateLabel}</span>
                              )}
                            </td>
                            <td className="py-3">
                              I did <span className="font-medium text-blue-500">{log.bodyPart}</span> with <span className="font-medium">{log.exercise}</span>: {log.weight}kg x {log.reps} reps.
                            </td>
                            <td className="py-3">
                              <button 
                                onClick={() => handleRemoveLog(index)}
                                className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyExercise() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExerciseContent />
    </Suspense>
  );
}
