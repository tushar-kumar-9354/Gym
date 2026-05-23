"use client";

import React, { useState, useEffect } from "react";
import StrengthChart from "@/components/charts/StrengthChart";
import { Plus, Target, Info, Sparkles, TrendingUp, Award, Activity, Edit2, RotateCcw, Dumbbell } from "lucide-react";
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
  
  const [trajectoryMode, setTrajectoryMode] = useState<'exercise' | 'bodypart'>('exercise');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string>("");
  const [activePlan, setActivePlan] = useState<string>("");
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [newGoal, setNewGoal] = useState<string>("");
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Initialize and load from localStorage
  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email && plan) {
      try {
        const saved = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
        const normalized = (saved || []).map((l: any) => {
          const exName = l.exerciseName ?? l.exercise ?? "";
          const dateStr = typeof l.date === "string" && l.date.length > 10 ? l.date.split('T')[0] : l.date;
          const ts = l.timestamp ?? Date.now();
          const weight = typeof l.weight === 'number' ? l.weight : parseFloat(l.weight) || 0;
          const reps = typeof l.reps === 'number' ? l.reps : parseInt(l.reps) || 0;
          const oneRMVal = l.oneRM ?? (reps > 0 ? calculateOneRM(weight, reps) : (l.oneRM ?? 0));
          return {
            id: l.id ?? `${dateStr}_${exName}_${ts}`,
            exerciseName: exName,
            exercise: exName,
            bodyPart: l.bodyPart ?? l.category ?? "",
            weight,
            reps,
            date: dateStr,
            timestamp: ts,
            setNumber: l.setNumber ?? 1,
            oneRM: Math.round(oneRMVal * 10) / 10,
          } as ExerciseLog;
        });
        setLogs(normalized);
      } catch (e) {
        console.error("Error parsing exercise logs", e);
        setLogs([]);
      }
    } else {
      setLogs([]);
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

  const handleSelectExercise = (exerciseName: string) => {
    setExercise(exerciseName);
  };

  // Filter logs for the active exercise
  const exerciseLogs = logs
    .filter(log => ((log.exerciseName ?? log.exercise) || "").toLowerCase() === exercise.toLowerCase())
    .sort((a, b) => a.timestamp - b.timestamp);

  // Extract dates and 1RMs for Chart
  const trackingType = getExerciseTrackingType(exercise);

  // Chart data can be per-exercise or aggregated by body part
  let chartDates: string[] = [];
  let chartValues: number[] = [];

  const formatDisplayDate = (d: string) => {
    if (!d) return "";
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) {
      // try parsing strings like 'May 5' — append current year
      const tryParse = new Date(`${d} ${new Date().getFullYear()}`);
      if (!isNaN(tryParse.getTime())) {
        const day = String(tryParse.getDate()).padStart(2, '0');
        const mon = months[tryParse.getMonth()];
        const yr = tryParse.getFullYear();
        return `${day}/${mon}/${yr}`;
      }
      return d;
    }
    const day = String(parsed.getDate()).padStart(2, '0');
    const mon = months[parsed.getMonth()];
    const yr = parsed.getFullYear();
    return `${day}/${mon}/${yr}`;
  };

  if (trajectoryMode === 'exercise') {
    chartDates = exerciseLogs.map(log => log.date);
    chartValues = exerciseLogs.map(log => {
      if (trackingType === "Time") return log.weight;
      if (trackingType === "Reps") return log.reps;
      return calculateOneRM(log.weight, log.reps);
    });
  } else {
    // Aggregate all logs for the active body part by date (use max value per date)
    const bodyLogs = logs
      .filter(l => l.bodyPart === activeTab)
      .sort((a, b) => a.timestamp - b.timestamp);

    const dateMap: Record<string, { ts: number; value: number }[]> = {};
    bodyLogs.forEach(l => {
      const valType = getExerciseTrackingType(l.exerciseName);
      const val = valType === 'Time' ? l.weight : valType === 'Reps' ? l.reps : calculateOneRM(l.weight, l.reps);
      if (!dateMap[l.date]) dateMap[l.date] = [];
      dateMap[l.date].push({ ts: l.timestamp, value: val });
    });

    const entries = Object.keys(dateMap).map(d => ({
      date: d,
      ts: Math.min(...dateMap[d].map(x => x.ts)),
      value: Math.max(...dateMap[d].map(x => x.value)),
    })).sort((a, b) => a.ts - b.ts);

    chartDates = entries.map(e => e.date);
    chartValues = entries.map(e => e.value);
  }

  const displayChartDates = chartDates.map(d => formatDisplayDate(d));

  // Calculate stats
  const currentBestValue = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const defaultTarget = currentBestValue > 0 ? Number((currentBestValue * 1.15).toFixed(2)) : 100;
  const targetValue = goals[exercise] ?? defaultTarget;
  const progressPercent = targetValue > 0 ? Math.min((currentBestValue / targetValue) * 100, 100) : 0;
  const goalDifference = Number((targetValue - currentBestValue).toFixed(2));
  const goalReached = currentBestValue >= targetValue;



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

  // Group logs by date, collect body parts and exercises per date
  const dateGroups = Object.values(
    logs.reduce((acc: Record<string, any>, l) => {
      const dateKey = l.date || 'unknown';
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, bodyParts: new Set<string>(), exercises: {} };
      const container = acc[dateKey];
      if (l.bodyPart) container.bodyParts.add(l.bodyPart);
      const exName = l.exerciseName || l.exercise || 'Unknown Exercise';
      if (!container.exercises[exName]) container.exercises[exName] = [];
      container.exercises[exName].push(l);
      return acc;
    }, {})
  ).map((g: any) => {
    // convert bodyParts set to sorted array and sort exercises' sets by timestamp
    const bodyPartsArr = Array.from(g.bodyParts || []).sort();
    const exercises = Object.keys(g.exercises).map((ex: string) => ({ name: ex, sets: g.exercises[ex].sort((a: any, b: any) => a.timestamp - b.timestamp) }));
    return { date: g.date, bodyParts: bodyPartsArr, exercises };
  }).sort((a: any, b: any) => {
    // newest date first based on first set timestamp where available
    const aTs = a.exercises.length ? a.exercises[0].sets[0].timestamp : 0;
    const bTs = b.exercises.length ? b.exercises[0].sets[0].timestamp : 0;
    return bTs - aTs;
  });

  // Build month and date options from logs
  const monthNamesFull = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthOptions = Array.from(new Set(logs.map(l => {
    const parsed = new Date(l.date);
    if (!isNaN(parsed.getTime())) return `${monthNamesFull[parsed.getMonth()]} ${parsed.getFullYear()}`;
    // fallback: try parse 'May 5' style
    const parts = String(l.date).split(' ');
    if (parts.length >= 2) return `${parts[0]} ${new Date().getFullYear()}`;
    return `Unknown`;
  }))).filter(Boolean).sort((a: any, b: any) => {
    // sort newest first by parsing year+month
    const ad = new Date(a);
    const bd = new Date(b);
    return bd.getTime() - ad.getTime();
  });

  const dateOptionsForMonth = (monthLabel: string | null) => {
    if (!monthLabel) return [];
    const [mName, yStr] = monthLabel.split(' ');
    const monthIndex = monthNamesFull.findIndex(x => x.toLowerCase() === mName.toLowerCase());
    const year = parseInt(yStr) || new Date().getFullYear();
    const dates = Array.from(new Set(logs.map(l => {
      const d = new Date(l.date);
      if (!isNaN(d.getTime()) && d.getMonth() === monthIndex && d.getFullYear() === year) return l.date;
      // fallback: if stored as 'May 5'
      if (String(l.date).toLowerCase().includes(mName.toLowerCase())) return l.date;
      return null;
    }).filter(Boolean)));
    // sort newest first by timestamp
    return dates.sort((a: any, b: any) => {
      const ta = logs.find((x: any) => x.date === a)?.timestamp ?? 0;
      const tb = logs.find((x: any) => x.date === b)?.timestamp ?? 0;
      return tb - ta;
    });
  };

  // Determine visible groups based on filters (selected date > selected month > last 3 days)
  const visibleGroups = (() => {
    if (selectedDateFilter) return dateGroups.filter((g: any) => g.date === selectedDateFilter);
    if (selectedMonth) {
      return dateGroups.filter((g: any) => {
        const parsed = new Date(g.date);
        if (!isNaN(parsed.getTime())) return `${monthNamesFull[parsed.getMonth()]} ${parsed.getFullYear()}` === selectedMonth;
        return String(g.date).toLowerCase().includes((selectedMonth.split(' ')[0] || '').toLowerCase());
      });
    }
    return dateGroups.slice(0, 3);
  })();

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
                  type="button"
                  key={ex}
                  onClick={() => handleSelectExercise(ex)}
                  aria-pressed={exercise === ex}
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
                  Strength Trajectory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Track how your lifting progression evolves over time</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-md bg-surface border border-border p-1">
                  <button
                    onClick={() => setTrajectoryMode('exercise')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md ${trajectoryMode === 'exercise' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}
                  >
                    Exercise
                  </button>
                  <button
                    onClick={() => setTrajectoryMode('bodypart')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md ${trajectoryMode === 'bodypart' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}
                  >
                    Bodypart
                  </button>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 bg-surface border border-border rounded-lg text-blue-600 tracking-wide">
                  {trajectoryMode === 'exercise' ? exercise : `${activeTab} (Aggregate)`}
                </div>
              </div>
            </div>
            
            {exerciseLogs.length > 0 ? (
              <div className="bg-surface p-4 border border-border rounded-xl">
                <StrengthChart dates={displayChartDates} oneRMs={chartValues} exerciseName={exercise} />
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
            <div className="flex gap-2 items-center mb-4">
              <label className="text-xs text-slate-600">Month:</label>
              <select value={selectedMonth ?? ""} onChange={(e) => { setSelectedMonth(e.target.value || null); setSelectedDateFilter(null); }} className="text-sm border border-border rounded px-2 py-1">
                <option value="">All</option>
                {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <label className="text-xs text-slate-600">Date:</label>
              <select value={selectedDateFilter ?? ""} onChange={(e) => setSelectedDateFilter(e.target.value || null)} className="text-sm border border-border rounded px-2 py-1">
                <option value="">All</option>
                {dateOptionsForMonth(selectedMonth).map(d => <option key={d} value={d}>{formatDisplayDate(d)}</option>)}
              </select>

              <button onClick={() => { setSelectedMonth(null); setSelectedDateFilter(null); }} className="text-xs text-slate-500 hover:text-slate-900 ml-2">Clear</button>
            </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Date</th>
                      <th className="pb-3">Exercise</th>
                      <th className="pb-3">Lifting Load</th>
                      <th className="pb-3">Reps Logged</th>
                      <th className="pb-3">Calculated metric</th>
                    </tr>
                  </thead>
                  {visibleGroups.length > 0 ? visibleGroups.map((group: any) => (
                    <tbody key={group.date} className="text-sm divide-y divide-border">
                      <tr className="bg-surface/50">
                        <td className="py-2 pl-2 font-medium text-slate-700">{formatDisplayDate(group.date)}</td>
                        <td className="py-2 font-medium text-slate-800">
                          {group.bodyParts.length === 0 ? '—' : group.bodyParts.length === 1 ? group.bodyParts[0] : `Mix (${group.bodyParts.join(', ')})`}
                        </td>
                        <td className="py-2" colSpan={3}></td>
                      </tr>
                      {group.exercises.map((ex: any) => (
                        <React.Fragment key={`${group.date}_${ex.name}`}>
                          <tr className="bg-white">
                            <td className="py-2"></td>
                            <td className="py-2 font-semibold text-slate-900">{ex.name}</td>
                            <td className="py-2" colSpan={3}></td>
                          </tr>
                          {ex.sets.slice().reverse().map((s: any) => {
                            const setType = getExerciseTrackingType(s.exerciseName || s.exercise);
                            const est = setType === 'Time' ? s.weight : setType === 'Reps' ? s.reps : calculateOneRM(s.weight, s.reps);
                            return (
                              <tr key={s.id} className="hover:bg-blue-50 transition-colors">
                                <td className="py-3 pl-2 font-medium text-slate-700">{formatDisplayDate(s.date)}</td>
                                <td className="py-3 font-medium text-slate-800">Set {s.setNumber}</td>
                                <td className="py-3 font-semibold text-slate-950">{setType === 'Time' ? '-' : `${s.weight} kg`}</td>
                                <td className="py-3 font-semibold text-slate-950">{s.reps} {setType === 'Reps' ? 'reps' : ''}</td>
                                <td className="py-3 font-bold text-blue-600">{formatExerciseValue(est, setType)}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  )) : (
                    <tbody>
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">No lifting data has been recorded yet. Add workouts through your training plan.</td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
          </section>
        </div>
      </div>
    </div>
  );
}
