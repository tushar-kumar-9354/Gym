"use client";

import React, { useState, useEffect } from "react";
import StrengthChart from "@/components/charts/StrengthChart";
import { Plus, Target, Info, Sparkles, TrendingUp, Award, Activity, Trash2, Edit2, RotateCcw, Dumbbell } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import { calculateOneRM, getExerciseTrackingType, formatExerciseValue, ExerciseTrackingType } from "@/utils/oneRM";

interface ExerciseLog {
  id: string;
  exerciseName: string;
  bodyPart: string;
  weight: number;
  reps: number;
  date: string;
  timestamp: number;
  oneRM?: number;
}

const DEFAULT_EXERCISES: Record<string, string[]> = {
  Chest: ["Bench Press", "Incline Dumbbell Press", "Incline Barbell Press", "Chest Flyes"],
  Back: ["Deadlift", "Pull-ups", "Bent Over Rows", "Lat Pulldowns"],
  Legs: ["Squat", "Leg Press", "Lying Leg Curls", "Calf Raises"],
  Shoulders: ["Overhead Press", "Lateral Raises", "Military Press", "Arnold Press"],
  Arms: ["Bicep Curls", "Tricep Pushdowns", "Hammer Curls", "Skull Crushers"],
  Abs: ["Plank", "Crunches", "Leg Raises", "Russian Twists"]
};

export default function StrengthTracker() {
  const [activeTab, setActiveTab] = useState<string>("Chest");
  const [exercise, setExercise] = useState<string>("Bench Press");
  
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [activePlan, setActivePlan] = useState<string>("");
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [newGoal, setNewGoal] = useState<string>("");
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Initialize and load from localStorage
  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "demo@gymprogress.com";
    setUserEmail(email);
    
    // Fetch active plan
    const profile = localStorage.getItem(`${email}_profile`);
    const planName = profile ? JSON.parse(profile).activePlanName || "Bulk" : "Bulk";
    setActivePlan(planName);

    // Fetch existing workout logs
    const storedLogs = localStorage.getItem(`${email}_${planName}_exerciseLogs`);
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error("Error parsing exercise logs", e);
      }
    } else {
      // Fallback default mock logs if none exist
      const mockLogs: ExerciseLog[] = [
        { id: "1", exerciseName: "Bench Press", bodyPart: "Chest", weight: 60, reps: 8, date: "May 5", timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000 },
        { id: "2", exerciseName: "Bench Press", bodyPart: "Chest", weight: 65, reps: 6, date: "May 10", timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 },
        { id: "3", exerciseName: "Bench Press", bodyPart: "Chest", weight: 65, reps: 8, date: "May 15", timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 },
        { id: "4", exerciseName: "Squat", bodyPart: "Legs", weight: 80, reps: 8, date: "May 5", timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000 },
        { id: "5", exerciseName: "Squat", bodyPart: "Legs", weight: 85, reps: 6, date: "May 10", timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 },
        { id: "6", exerciseName: "Squat", bodyPart: "Legs", weight: 90, reps: 6, date: "May 15", timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 }
      ];
      localStorage.setItem(`${email}_${planName}_exerciseLogs`, JSON.stringify(mockLogs));
      setLogs(mockLogs);
    }

    // Fetch strength goals
    const storedGoals = localStorage.getItem(`${email}_strength_goals`);
    if (storedGoals) {
      try {
        setGoals(JSON.parse(storedGoals));
      } catch (e) {
        console.error("Error parsing strength goals", e);
      }
    }
  }, []);

  // Update default exercise when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const firstEx = DEFAULT_EXERCISES[tab]?.[0] || "";
    setExercise(firstEx);
  };

  // Filter logs for the active exercise
  const exerciseLogs = logs
    .filter(log => log.exerciseName.toLowerCase() === exercise.toLowerCase())
    .sort((a, b) => a.timestamp - b.timestamp);

  // Extract dates and 1RMs for Chart
  const trackingType = getExerciseTrackingType(exercise);
  
  const chartDates = exerciseLogs.map(log => log.date);
  const chartValues = exerciseLogs.map(log => {
    if (trackingType === "Time") {
      return log.weight; // For time-based exercises, weight holds time in seconds
    } else if (trackingType === "Reps") {
      return log.reps; // For bodyweight reps exercises
    }
    // For strength exercises, compute the 1RM
    return calculateOneRM(log.weight, log.reps);
  });

  // Calculate stats
  const currentBestValue = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const defaultTarget = currentBestValue > 0 ? Number((currentBestValue * 1.15).toFixed(2)) : 100;
  const targetValue = goals[exercise] ?? defaultTarget;
  const progressPercent = targetValue > 0 ? Math.min((currentBestValue / targetValue) * 100, 100) : 0;
  const goalDifference = Number((targetValue - currentBestValue).toFixed(2));
  const goalReached = currentBestValue >= targetValue;

  // Add a new set log directly
  const handleAddSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !reps) return;

    const numWeight = parseFloat(weight);
    const numReps = parseInt(reps);
    if (isNaN(numWeight) || isNaN(numReps) || numWeight <= 0 || numReps <= 0) return;

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const newLog: ExerciseLog = {
      id: Math.random().toString(36).substring(2, 9),
      exerciseName: exercise,
      bodyPart: activeTab,
      weight: numWeight,
      reps: numReps,
      date: formattedDate,
      timestamp: Date.now(),
      oneRM: calculateOneRM(numWeight, numReps)
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updatedLogs));

    // Clear input forms
    setWeight("");
    setReps("");
  };

  // Save the custom strength goal
  const handleSaveGoal = () => {
    const val = parseFloat(newGoal);
    if (isNaN(val) || val <= 0) return;

    const roundedGoal = Number(val.toFixed(2));
    const updatedGoals = { ...goals, [exercise]: roundedGoal };
    setGoals(updatedGoals);
    localStorage.setItem(`${userEmail}_strength_goals`, JSON.stringify(updatedGoals));
    setIsEditingGoal(false);
    setNewGoal("");
  };

  // Delete a logged set
  const handleDeleteLog = (id: string) => {
    const updated = logs.filter(log => log.id !== id);
    setLogs(updated);
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updated));
  };

  // 1RM Formulas (Only for 1RM Tracking types)
  const lastLog = exerciseLogs[exerciseLogs.length - 1];
  const lastWeight = lastLog?.weight || 0;
  const lastReps = lastLog?.reps || 0;

  const formulas = {
    epley: lastWeight * (1 + lastReps / 30),
    brzycki: lastWeight / (1.0278 - 0.0278 * lastReps),
    lander: (100 * lastWeight) / (101.3 - 2.6712 * lastReps),
    lombardi: lastWeight * Math.pow(lastReps, 0.1),
    oconner: lastWeight * (1 + lastReps / 40)
  };

  // Target guideline intensities based on Epley 1RM
  const current1RM = formulas.epley || 0;
  const trainingZones = [
    { name: "Absolute Power", percentage: 95, reps: "1-2 reps", weight: Math.round(current1RM * 0.95) },
    { name: "Max Strength", percentage: 85, reps: "5-6 reps", weight: Math.round(current1RM * 0.85) },
    { name: "Hypertrophy-Strength", percentage: 80, reps: "8 reps", weight: Math.round(current1RM * 0.80) },
    { name: "Hypertrophy", percentage: 75, reps: "10 reps", weight: Math.round(current1RM * 0.75) },
    { name: "Endurance", percentage: 65, reps: "15+ reps", weight: Math.round(current1RM * 0.65) }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Award className="text-blue-600" />
            Strength Lab & 1RM Analytics
          </h1>
          <p className="text-slate-600 mt-1">
            Visualise progressive overload targets, log physical lifts, and compare scientific physiology formulas.
          </p>
        </div>
        
        {/* Category Switcher Tabs */}
        <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-white border border-border rounded-xl max-w-full">
          {Object.keys(DEFAULT_EXERCISES).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" 
                  : "text-slate-600 hover:bg-blue-50 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Controls, Logs, & Goals */}
        <div className="space-y-6">
          {/* Active Exercise Selector */}
          <section className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-border">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            <h2 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={18} />
              Select Target Exercise
            </h2>
            <div className="space-y-2">
              {DEFAULT_EXERCISES[activeTab]?.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setExercise(ex)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    exercise === ex
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-700 font-bold"
                      : "bg-surface border border-border text-slate-700 hover:bg-blue-50 hover:text-slate-900"
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </section>

          {/* Quick Input Log Form */}
          <section className="glass-panel p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-1.5">
              <Plus className="text-blue-600" size={18} />
              Log Set (Direct Entry)
            </h2>
            
            <form onSubmit={handleAddSet} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {trackingType === "Time" ? "Hold Time (secs)" : "Weight (kg)"}
                  </label>
                  <input 
                    type="number" 
                    min="0.1"
                    step="any"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={trackingType === "Time" ? "e.g. 60" : "e.g. 80"}
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Reps Performed</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              >
                <Plus size={18} /> Add Lift Set
              </button>
            </form>
          </section>

          {/* Goal Tracker Card */}
          <section className="glass-panel p-6 rounded-2xl border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
            
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Target className="text-blue-600 animate-pulse" size={18} />
                Lifting Milestone Goal
              </h2>
              
              {!isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewGoal(targetValue.toString());
                      setIsEditingGoal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={14} />
                    Set milestone
                  </button>
                  <button 
                    onClick={() => {
                      setNewGoal(targetValue.toString());
                      setIsEditingGoal(true);
                    }}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                    aria-label="Edit milestone"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              ) : null}
            </div>

            {isEditingGoal ? (
              <div className="space-y-3 mb-4">
                <label className="block text-xs text-slate-500">Set milestone target</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 w-full"
                    placeholder={formatExerciseValue(targetValue, trackingType)}
                  />
                  <button onClick={handleSaveGoal} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors">
                    Save
                  </button>
                </div>
                <button onClick={() => setIsEditingGoal(false)} className="text-slate-500 hover:text-slate-900 text-xs px-2">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-slate-600">Current Best: <strong className="text-slate-950">{formatExerciseValue(currentBestValue, trackingType)}</strong></span>
                  <span className="text-slate-600">Milestone: <strong className="text-blue-600">{formatExerciseValue(targetValue, trackingType)}</strong></span>
                </div>
                <div className="text-slate-600">
                  {goalReached ? (
                    <span className="text-slate-700 font-semibold">Goal reached by {formatExerciseValue(Math.abs(goalDifference), trackingType)}.</span>
                  ) : (
                    <span className="text-slate-700 font-semibold">{formatExerciseValue(goalDifference, trackingType)} more to reach your milestone.</span>
                  )}
                </div>
              </div>
            )}

            <ProgressBar 
              label="Goal Completion" 
              progress={progressPercent} 
              colorClass="bg-blue-600" 
              showText={true} 
            />

            <p className="text-xs text-slate-500 mt-3 flex items-start gap-1">
              <Info size={13} className="mt-0.5 shrink-0" />
              Progress bar shows how close your current best lift is to the milestone target.
            </p>
          </section>
        </div>

        {/* MIDDLE & RIGHT COLUMN: charts, stats, formulas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Card */}
          <section className="glass-panel p-6 rounded-2xl border border-border relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} />
                  Performance Projection Chart
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Historical estimated progression values</p>
              </div>
              <div className="text-xs font-bold px-3 py-1.5 bg-surface border border-border rounded-lg text-blue-600 tracking-wide">
                {exercise}
              </div>
            </div>
            
            {exerciseLogs.length > 0 ? (
              <div className="bg-surface p-4 border border-border rounded-xl">
                <StrengthChart dates={chartDates} oneRMs={chartValues} exerciseName={exercise} />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-slate-50">
                <Dumbbell className="text-slate-400 mb-2 animate-bounce" size={32} />
                <p className="text-sm text-slate-500 font-medium">No recorded lift sessions for {exercise}</p>
                <p className="text-xs text-slate-400 mt-1">Use the quick log input to register your first set!</p>
              </div>
            )}
          </section>

          {/* Logic Blocks: Formula Comparison & Training Zones */}
          {trackingType === "1RM" && current1RM > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scientific Formula Comparison Grid */}
              <section className="glass-panel p-6 rounded-2xl border border-border">
                <h2 className="text-md font-bold text-slate-950 mb-4 flex items-center gap-1.5">
                  <Activity className="text-blue-600" size={18} />
                  Physiology 1RM Formulas
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                    <span className="text-slate-600 font-medium">Epley Formula</span>
                    <span className="text-slate-950 font-bold">{Math.round(formulas.epley * 10) / 10} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                    <span className="text-slate-600 font-medium">Brzycki Formula</span>
                    <span className="text-slate-950 font-bold">{Math.round(formulas.brzycki * 10) / 10} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                    <span className="text-slate-600 font-medium">Lander Formula</span>
                    <span className="text-slate-950 font-bold">{Math.round(formulas.lander * 10) / 10} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 border-b border-border">
                    <span className="text-slate-600 font-medium">Lombardi Formula</span>
                    <span className="text-slate-950 font-bold">{Math.round(formulas.lombardi * 10) / 10} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5">
                    <span className="text-slate-600 font-medium">O&apos;Conner Formula</span>
                    <span className="text-slate-950 font-bold">{Math.round(formulas.oconner * 10) / 10} kg</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-normal">
                  *Different physiological equations evaluate metabolic capacity differently based on mechanical rep volume.
                </p>
              </section>

              {/* Hypertrophy and Strength Target Intensities */}
              <section className="glass-panel p-6 rounded-2xl border border-border">
                <h2 className="text-md font-bold text-slate-950 mb-4 flex items-center gap-1.5">
                  <Target className="text-blue-600" size={18} />
                  Lifting Load Recommendations
                </h2>
                <div className="space-y-2.5">
                  {trainingZones.map((zone) => (
                    <div key={zone.name} className="flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-slate-950 font-bold">{zone.name}</span>
                        <span className="text-[10px] text-slate-500">{zone.percentage}% 1RM • {zone.reps}</span>
                      </div>
                      <span className="bg-slate-100 border border-border text-slate-700 font-black px-2 py-1 rounded">
                        {zone.weight} kg
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {/* Recent History Table */}
          <section className="glass-panel p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
              <RotateCcw className="text-blue-600" size={18} />
              Workout Lift History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Date</th>
                    <th className="pb-3">Lifting Load</th>
                    <th className="pb-3">Reps Logged</th>
                    <th className="pb-3">Calculated metric</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border">
                  {exerciseLogs.slice().reverse().map((log) => {
                    const estValue = trackingType === "Time" 
                      ? log.weight 
                      : trackingType === "Reps" 
                        ? log.reps 
                        : calculateOneRM(log.weight, log.reps);
                    
                    return (
                      <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                        <td className="py-3 pl-2 font-medium text-slate-700">{log.date}</td>
                        <td className="py-3 font-semibold text-slate-950">
                          {trackingType === "Time" ? "-" : `${log.weight} kg`}
                        </td>
                        <td className="py-3 font-semibold text-slate-950">{log.reps} reps</td>
                        <td className="py-3 font-bold text-blue-600">
                          {formatExerciseValue(estValue, trackingType)}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-slate-500 hover:text-red-500 transition-colors p-1"
                            title="Delete this set log"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {exerciseLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                        No lifting data has been recorded yet. Select another exercise or log a direct set above!
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
