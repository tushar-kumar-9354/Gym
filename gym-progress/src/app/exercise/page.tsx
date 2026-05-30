"use client";

import React, { useState, useEffect, Suspense } from "react";
import { calculateOneRM, getExerciseTrackingType, formatExerciseValue } from "@/utils/oneRM";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StrengthChart from "@/components/charts/StrengthChart";

function ExerciseContent() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");

  const [date, setDate] = useState<string>(urlDate || new Date().toISOString().split('T')[0]);
  const [bodyPart, setBodyPart] = useState("Chest");
  const [exercise, setExercise] = useState("Bench Press");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
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
    Abs: ["Plank", "Crunches", "Leg Raises", "Russian Twists"],
  };

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email && plan) {
      const savedLogs = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
      // Normalize: ensure date is YYYY-MM-DD, add setNumber if missing, and provide id/oneRM
      const normalizedLogs = savedLogs.map((l: any) => ({
        id: l.id ?? `${l.date ?? ''}_${l.exercise ?? l.exerciseName ?? ''}_${l.timestamp ?? Date.now()}`,
        ...l,
        exercise: l.exercise ?? l.exerciseName,
        date: typeof l.date === "string" && l.date.length > 10 ? l.date.split('T')[0] : l.date,
        setNumber: l.setNumber ?? 1,
        oneRM: l.oneRM ?? (l.reps && l.weight ? Math.round(calculateOneRM(parseFloat(l.weight), parseInt(l.reps)) * 10) / 10 : l.oneRM ?? 0),
      }));
      setLogs(normalizedLogs);
    }
  }, []);

  const handleBodyPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const part = e.target.value;
    setBodyPart(part);
    setExercise(exerciseDatabase[part][0]);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !activePlan) {
      alert("Please select a plan first!");
      return;
    }

    const type = getExerciseTrackingType(exercise, bodyPart);
    let finalWeight = 0;
    let finalReps = 0;
    let finalOneRM = 0;

    if (type === "Time") {
      const minVal = parseInt(minutes) || 0;
      const secVal = parseInt(seconds) || 0;
      const totalSec = minVal * 60 + secVal;
      if (totalSec <= 0) {
        alert("Please enter a valid duration!");
        return;
      }
      finalWeight = 0;
      finalReps = totalSec;
      finalOneRM = totalSec;
    } else if (type === "Reps") {
      const repsVal = parseInt(reps) || 0;
      if (repsVal <= 0) {
        alert("Please enter reps!");
        return;
      }
      finalWeight = parseFloat(weight) || 0;
      finalReps = repsVal;
      finalOneRM = repsVal;
    } else {
      if (!weight || !reps) {
        alert("Please enter weight and reps!");
        return;
      }
      finalWeight = parseFloat(weight);
      finalReps = parseInt(reps);
      finalOneRM = calculateOneRM(finalWeight, finalReps);
    }

    const logDate = date;

    // Count how many sets of this exercise exist on this day already
    const existingSets = logs.filter(
      l => l.date === logDate && l.bodyPart === bodyPart && l.exercise === exercise
    );
    const nextSetNumber = existingSets.length + 1;

    const newLog = {
      date: logDate,
      bodyPart,
      exercise,
      weight: finalWeight,
      reps: finalReps,
      setNumber: nextSetNumber,
      oneRM: Math.round(finalOneRM * 10) / 10,
      id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    };

    const updatedLogs = [...logs, newLog];
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
    setWeight("");
    setReps("");
    setMinutes("");
    setSeconds("");
  };

  const handleRemoveLog = (logToRemove: any) => {
    if (!userEmail || !activePlan) return;
    let updated = logs;
    if (logToRemove && logToRemove.id) {
      updated = logs.filter(l => l.id !== logToRemove.id);
    } else {
      const idx = logs.findIndex(l => l.date === logToRemove.date && l.exercise === logToRemove.exercise && l.bodyPart === logToRemove.bodyPart && l.setNumber === logToRemove.setNumber);
      if (idx !== -1) {
        updated = [...logs];
        updated.splice(idx, 1);
      }
    }
    // Re-number the sets for this exercise on this day
    let setCounter = 0;
    const renumbered = updated.map(l => {
      if (l.date === logToRemove.date && l.exercise === logToRemove.exercise && l.bodyPart === logToRemove.bodyPart) {
        setCounter++;
        return { ...l, setNumber: setCounter };
      }
      return l;
    });
    setLogs(renumbered);
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(renumbered));
  };

  // Filter logs for display
  const filteredDisplayLogs = logs.filter(log => {
    if (filter === "All") return true;

    const logDate = log.date;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (filter === "Today") return logDate === today;
    if (filter === "Yesterday") return logDate === yesterday;

    return log.bodyPart === filter;
  });

  // Group filtered logs by date + exercise for grouped display
  const groupedLogs: { key: string; date: string; bodyPart: string; exercise: string; sets: any[] }[] = [];
  filteredDisplayLogs.forEach(log => {
    const groupKey = `${log.date}_${log.bodyPart}_${log.exercise}`;
    const existing = groupedLogs.find(g => g.key === groupKey);
    if (existing) {
      existing.sets.push(log);
    } else {
      groupedLogs.push({
        key: groupKey,
        date: log.date,
        bodyPart: log.bodyPart,
        exercise: log.exercise,
        sets: [log],
      });
    }
  });

  // Sort groups: newest first
  groupedLogs.sort((a, b) => b.date.localeCompare(a.date));

  // Filter logs for chart
  const chartLogs = logs.filter(l => l.exercise === exercise);
  const dates = chartLogs.map(l => new Date(l.date).toLocaleDateString('en-US'));
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

              {getExerciseTrackingType(exercise, bodyPart) === "Time" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="e.g. 2"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seconds</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                      placeholder="e.g. 30"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : getExerciseTrackingType(exercise, bodyPart) === "Reps" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (optional)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Bodyweight"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      placeholder="e.g. 15"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
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
              )}

              {/* Show what set number this will be */}
              <div className="text-xs text-gray-500 text-center">
                This will be <span className="font-bold text-gray-900">Set {logs.filter(l => l.date === date && l.bodyPart === bodyPart && l.exercise === exercise).length + 1}</span> for {exercise} today
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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

            {/* Grouped Recent Workouts */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Workouts</h2>

                {/* Filter Bar */}
                <div className="flex flex-wrap gap-2">
                  {["All", "Today", "Yesterday", "Chest", "Back", "Legs"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filter === f
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {groupedLogs.length === 0 ? (
                  <p className="py-4 text-center text-gray-500">No exercises found for this filter.</p>
                ) : (
                  groupedLogs.map((group) => {
                    const today = new Date().toISOString().split('T')[0];
                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    const dateLabel = group.date === today ? "Today" : group.date === yesterday ? "Yesterday" : new Date(group.date).toLocaleDateString('en-US');

                    return (
                      <div key={group.key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        {/* Exercise Header */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            {group.date === today || group.date === yesterday ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.date === today ? 'bg-blue-50 text-blue-500' : 'bg-gray-200 text-gray-600'}`}>
                                {dateLabel}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12} /> {dateLabel}</span>
                            )}
                            <span className="font-semibold text-gray-900">{group.exercise}</span>
                            <span className="text-xs text-gray-400">({group.bodyPart})</span>
                          </div>
                          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                            {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}
                          </span>
                        </div>

                        {/* Individual Sets */}
                        <div className="space-y-1">
                          {group.sets
                            .sort((a: any, b: any) => (a.setNumber || 1) - (b.setNumber || 1))
                            .map((set: any, idx: number) => {
                              const trackingType = getExerciseTrackingType(set.exercise, set.bodyPart);
                              return (
                                <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 text-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900 w-12">Set {set.setNumber || idx + 1}</span>
                                    {trackingType === "Time" ? (
                                      <span className="text-gray-700">
                                        Duration: <span className="font-medium text-gray-900">{formatExerciseValue(set.reps, "Time")}</span>
                                      </span>
                                    ) : trackingType === "Reps" ? (
                                      <span className="text-gray-700">
                                        {set.weight > 0 ? <span className="text-xs text-gray-500 mr-2">({set.weight}kg)</span> : null}
                                        <span className="font-medium text-gray-900">{formatExerciseValue(set.reps, "Reps")}</span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-700">
                                        <span className="font-medium text-gray-900">{set.weight}kg</span> × <span className="font-medium text-gray-900">{set.reps} reps</span>
                                        <span className="text-xs text-gray-400 ml-3">1RM: {set.oneRM}kg</span>
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleRemoveLog(set)}
                                    className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })
                )}
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