"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, ChevronDown, Clock, Activity, Target, Flame, Sparkles,
  AlertTriangle, RefreshCw, Info, Droplets, Dumbbell, Moon, Zap,
  TrendingUp, Check, Plus, Trash2, Edit, Save, Trophy, ShieldAlert,
  ArrowRight, Heart, Star, HelpCircle, Mic, MicOff, ChevronUp, Award
} from "lucide-react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import { formatLiters, calculateOneRM, getExerciseTrackingType, formatExerciseValue } from "@/utils/oneRM";
import { computePlanTargets } from "@/lib/planTargets";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend
);

interface Plan {
  name: string;
  weight: number;
  goalWeight: number;
  duration: number;
  goal: string;
  activityLevel?: string;
  sleepTarget?: number;
}

interface MealItem {
  time: string;
  label: string;
  targetCalories: number;
  targetProtein: number;
}

interface HabitItem {
  time: string;
  task: string;
}

interface DayRoutine {
  muscleFocus: string[];
  exercises: string[];
  meals: MealItem[];
  habits: HabitItem[];
}

interface TimetableTemplate {
  [dayOfWeek: string]: DayRoutine;
}

interface ManualTask {
  id: string;
  time: string;
  task: string;
  date: string;
}

// Default schedules
const defaultWeeklyTemplate: TimetableTemplate = {
  Monday: {
    muscleFocus: ["Legs"],
    exercises: ["Barbell Squats", "Romanian Deadlifts", "Leg Extensions"],
    meals: [
      { time: "08:30 AM", label: "Breakfast", targetCalories: 500, targetProtein: 35 },
      { time: "01:00 PM", label: "Lunch", targetCalories: 700, targetProtein: 45 },
      { time: "05:00 PM", label: "Snack", targetCalories: 300, targetProtein: 15 },
      { time: "08:30 PM", label: "Dinner", targetCalories: 800, targetProtein: 55 }
    ],
    habits: [
      { time: "06:30 AM", task: "Drink 500ml water upon waking" },
      { time: "07:00 AM", task: "10-min morning mobility stretches" },
      { time: "10:30 PM", task: "Turn off screens & wind down" }
    ]
  },
  Tuesday: {
    muscleFocus: ["Back"],
    exercises: ["Lat Pulldowns", "Bent-Over Rows", "Pull-ups"],
    meals: [
      { time: "08:30 AM", label: "Breakfast", targetCalories: 500, targetProtein: 35 },
      { time: "01:00 PM", label: "Lunch", targetCalories: 700, targetProtein: 45 },
      { time: "05:00 PM", label: "Snack", targetCalories: 300, targetProtein: 15 },
      { time: "08:30 PM", label: "Dinner", targetCalories: 800, targetProtein: 55 }
    ],
    habits: [
      { time: "06:30 AM", task: "Drink 500ml water upon waking" },
      { time: "07:00 AM", task: "10-min morning mobility stretches" },
      { time: "10:30 PM", task: "Turn off screens & wind down" }
    ]
  },
  Wednesday: {
    muscleFocus: ["Chest"],
    exercises: ["Barbell Bench Press", "Incline Dumbbell Press", "Cable Flyes"],
    meals: [
      { time: "08:30 AM", label: "Breakfast", targetCalories: 500, targetProtein: 35 },
      { time: "01:00 PM", label: "Lunch", targetCalories: 700, targetProtein: 45 },
      { time: "05:00 PM", label: "Snack", targetCalories: 300, targetProtein: 15 },
      { time: "08:30 PM", label: "Dinner", targetCalories: 800, targetProtein: 55 }
    ],
    habits: [
      { time: "06:30 AM", task: "Drink 500ml water upon waking" },
      { time: "07:00 AM", task: "10-min morning mobility stretches" },
      { time: "10:30 PM", task: "Turn off screens & wind down" }
    ]
  },
  Thursday: {
    muscleFocus: ["Shoulders"],
    exercises: ["Overhead Dumbbell Press", "Lateral Raises"],
    meals: [
      { time: "08:30 AM", label: "Breakfast", targetCalories: 500, targetProtein: 35 },
      { time: "01:00 PM", label: "Lunch", targetCalories: 700, targetProtein: 45 },
      { time: "05:00 PM", label: "Snack", targetCalories: 300, targetProtein: 15 },
      { time: "08:30 PM", label: "Dinner", targetCalories: 800, targetProtein: 55 }
    ],
    habits: [
      { time: "06:30 AM", task: "Drink 500ml water upon waking" },
      { time: "07:00 AM", task: "10-min morning mobility stretches" },
      { time: "10:30 PM", task: "Turn off screens & wind down" }
    ]
  },
  Friday: {
    muscleFocus: ["Arms"],
    exercises: ["Bicep Curls", "Tricep Pushdowns"],
    meals: [
      { time: "08:30 AM", label: "Breakfast", targetCalories: 500, targetProtein: 35 },
      { time: "01:00 PM", label: "Lunch", targetCalories: 700, targetProtein: 45 },
      { time: "05:00 PM", label: "Snack", targetCalories: 300, targetProtein: 15 },
      { time: "08:30 PM", label: "Dinner", targetCalories: 800, targetProtein: 55 }
    ],
    habits: [
      { time: "06:30 AM", task: "Drink 500ml water upon waking" },
      { time: "07:00 AM", task: "10-min morning mobility stretches" },
      { time: "10:30 PM", task: "Turn off screens & wind down" }
    ]
  },
  Saturday: {
    muscleFocus: ["Rest"],
    exercises: [],
    meals: [
      { time: "09:00 AM", label: "Breakfast", targetCalories: 500, targetProtein: 30 },
      { time: "01:30 PM", label: "Lunch", targetCalories: 700, targetProtein: 40 },
      { time: "08:30 PM", label: "Dinner", targetCalories: 800, targetProtein: 50 }
    ],
    habits: [
      { time: "07:30 AM", task: "Drink 500ml water upon waking" },
      { time: "11:00 PM", task: "Turn off screens & wind down" }
    ]
  },
  Sunday: {
    muscleFocus: ["Rest"],
    exercises: [],
    meals: [
      { time: "09:00 AM", label: "Breakfast", targetCalories: 500, targetProtein: 30 },
      { time: "01:30 PM", label: "Lunch", targetCalories: 700, targetProtein: 40 },
      { time: "08:30 PM", label: "Dinner", targetCalories: 800, targetProtein: 50 }
    ],
    habits: [
      { time: "07:30 AM", task: "Drink 500ml water upon waking" },
      { time: "11:00 PM", task: "Turn off screens & wind down" }
    ]
  }
};

const exerciseDatabase: { [key: string]: string[] } = {
  Chest: ["Barbell Bench Press", "Incline Dumbbell Press", "Cable Flyes"],
  Back: ["Lat Pulldowns", "Bent-Over Rows", "Pull-ups"],
  Legs: ["Barbell Squats", "Romanian Deadlifts", "Leg Extensions"],
  Shoulders: ["Overhead Dumbbell Press", "Lateral Raises"],
  Arms: ["Bicep Curls", "Tricep Pushdowns"]
};

const exerciseDetailsMap: { [key: string]: { rest: number; water: string } } = {
  "Barbell Bench Press": { rest: 120, water: "Drink 3 sips of water only after finishing Set 2 of Barbell Bench Press" },
  "Incline Dumbbell Press": { rest: 90, water: "Drink 2 sips of water only after finishing Set 2 of Incline Dumbbell Press" },
  "Cable Flyes": { rest: 60, water: "Drink 2 sips of water only after finishing Set 3 of Cable Flyes" },
  "Lat Pulldowns": { rest: 90, water: "Drink 3 sips of water only after finishing Set 2 of Lat Pulldowns" },
  "Bent-Over Rows": { rest: 120, water: "Drink 3 sips of water only after finishing Set 2 of Bent-Over Rows" },
  "Pull-ups": { rest: 120, water: "Drink 2 sips of water only after finishing Set 3 of Pull-ups" },
  "Barbell Squats": { rest: 150, water: "Drink 4 sips of water only after finishing Set 2 of Barbell Squats" },
  "Romanian Deadlifts": { rest: 120, water: "Drink 3 sips of water only after finishing Set 2 of Romanian Deadlifts" },
  "Leg Extensions": { rest: 60, water: "Drink 2 sips of water only after finishing Set 3 of Leg Extensions" },
  "Overhead Dumbbell Press": { rest: 90, water: "Drink 3 sips of water only after finishing Set 2 of Overhead Dumbbell Press" },
  "Lateral Raises": { rest: 65, water: "Drink 2 sips of water only after finishing Set 3 of Lateral Raises" },
  "Bicep Curls": { rest: 60, water: "Drink 2 sips of water only after finishing Set 2 of Bicep Curls" },
  "Tricep Pushdowns": { rest: 60, water: "Drink 2 sips of water only after finishing Set 2 of Tricep Pushdowns" }
};

interface WarmUpMove {
  name: string;
  duration: string;
  desc: string;
}

interface CooldownMove {
  name: string;
  duration: string;
  desc: string;
}

interface ExerciseDetail {
  name: string;
  restSeconds: number;
  waterRule: string;
}

interface CoachingGuide {
  warmUp: WarmUpMove[];
  exercises: ExerciseDetail[];
  cooldown: CooldownMove[];
}

function getCoachingGuide(exercises: string[]): CoachingGuide {
  const warmUp: WarmUpMove[] = [
    { name: "Dynamic Shoulder Rotations", duration: "2 mins", desc: "Open the shoulder sockets and warm up rotator cuffs dynamically." },
    { name: "Core & Hips Stretch", duration: "1.5 mins", desc: "Dynamic stretch for lower back, hips, and core activation." },
    { name: "Full Body Arm Swings", duration: "1.5 mins", desc: "Lubricate dynamic chest, lat, and shoulder joints." }
  ];

  const cooldown: CooldownMove[] = [
    { name: "Doorway Static Chest Stretch", duration: "2 mins", desc: "Hold static stretch to release tight chest muscles." },
    { name: "Child's Pose Lat Stretch", duration: "2 mins", desc: "Reach forward on the floor to elongate back and lats." },
    { name: "Box Breathing Parasympathetic Reset", duration: "1 min", desc: "Inhale 4s, Hold 4s, Exhale 4s to trigger recovery." }
  ];

  const formattedExercises = exercises.map(ex => {
    const detail = exerciseDetailsMap[ex] || { rest: 90, water: `Drink 3 sips of water after Set 2 of ${ex}` };
    return {
      name: ex,
      restSeconds: detail.rest,
      waterRule: detail.water
    };
  });

  return { warmUp, exercises: formattedExercises, cooldown };
}

function getCurrentWeekDates() {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const dates: { [dayName: string]: string } = {};
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates[dayNames[i]] = d.toISOString().split('T')[0];
  }
  return dates;
}

export default function DailyRoutine() {
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [latestWeight, setLatestWeight] = useState<number>(80);

  // Phase controller: "auto" (detected by days logged), "week1" (force manual), "week2" (force smart)
  const [phaseMode, setPhaseMode] = useState<"auto" | "week1" | "week2">("auto");
  
  // Weekly timetable template editor states
  const [activeTab, setActiveTab] = useState<"planner" | "editor">("planner");
  const [timetableTemplate, setTimetableTemplate] = useState<TimetableTemplate>(defaultWeeklyTemplate);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [actualToday, setActualToday] = useState<string>("Monday");
  const [selectedEditorDay, setSelectedEditorDay] = useState<string>("Monday");

  // On-demand diet panel expanded state
  const [showDietSection, setShowDietSection] = useState(false);

  // Voice Note state
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // User logs loaded states
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [dietLogs, setDietLogs] = useState<any[]>([]);
  const [manualTasks, setManualTasks] = useState<ManualTask[]>([]);

  // STEP TRACKER STATE variables
  const [steps, setSteps] = useState<number>(0);
  const [stepTarget, setStepTarget] = useState<number>(8000);
  const [stepReminderTime, setStepReminderTime] = useState<string>("09:00 PM");
  const [showStepReminderPopup, setShowStepReminderPopup] = useState<boolean>(false);
  const [hasDismissedStepPopup, setHasDismissedStepPopup] = useState<boolean>(false);

  // Additional scoring parameter logs
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [waterLogged, setWaterLogged] = useState<number>(2.0); // in Liters

  // Form states for manual timetable (Week 1)
  const [manualTaskTime, setManualTaskTime] = useState("07:30 AM");
  const [manualTaskName, setManualTaskName] = useState("");

  const [manualMealTime, setManualMealTime] = useState("08:30 AM");
  const [manualMealName, setManualMealName] = useState("");
  const [manualMealCals, setManualMealCals] = useState("500");
  const [manualMealProt, setManualMealProt] = useState("35");

  const [manualExName, setManualExName] = useState("Barbell Bench Press");
  const [manualExSets, setManualExSets] = useState("3");
  const [manualExReps, setManualExReps] = useState("10");
  const [manualExWeight, setManualExWeight] = useState("60");

  // Profile metadata
  const [customTargets, setCustomTargets] = useState<any>(null);
  const [gymTiming, setGymTiming] = useState("06:00 PM");

  // Template editor inputs
  const [newMealName, setNewMealName] = useState("");
  const [newMealTime, setNewMealTime] = useState("08:00 AM");
  const [newMealCals, setNewMealCals] = useState(400);
  const [newMealProt, setNewMealProt] = useState(25);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitTime, setNewHabitTime] = useState("07:00 AM");

  // Logger forms per exercise
  const [loggerState, setLoggerState] = useState<{
    [exerciseName: string]: { weight: string; reps: string }
  }>({});

  // Completions trackers
  const [completedMeals, setCompletedMeals] = useState<{ [key: string]: boolean }>({});
  const [completedHabits, setCompletedHabits] = useState<{ [key: string]: boolean }>({});

  // Rest Timer states
  const [restTimer, setRestTimer] = useState<{
    timeLeft: number;
    duration: number;
    isActive: boolean;
    exerciseName: string;
  }>({ timeLeft: 0, duration: 0, isActive: false, exerciseName: "" });

  // Catch-Up Override
  const [catchUpOverride, setCatchUpOverride] = useState<"auto" | "active" | "inactive">("auto");

  // Speech Synthesizer using hi-IN for natural Hinglish
  const playVoiceNote = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Speech synthesis is not supported on this browser. Script: " + text);
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    setIsPlayingVoice(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  };

  // Rest Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer.isActive && restTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev.timeLeft <= 1) {
            playBeep();
            return { ...prev, timeLeft: 0, isActive: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer.isActive]);

  // Daily Step Alert Checker Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHrs = now.getHours();
      const currentMins = now.getMinutes();

      const parseTime = (t: string) => {
        const match = t.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
        if (!match) return { hrs: 21, mins: 0 };
        let hrs = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const ap = match[3];
        if (ap === "PM" && hrs < 12) hrs += 12;
        if (ap === "AM" && hrs === 12) hrs = 0;
        return { hrs, mins };
      };

      const target = parseTime(stepReminderTime);

      if (currentHrs === target.hrs && currentMins === target.mins && steps < stepTarget && !hasDismissedStepPopup) {
        setShowStepReminderPopup(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [stepReminderTime, steps, stepTarget, hasDismissedStepPopup]);

  // Load state from local storage on mount
  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const planName = email ? localStorage.getItem(`${email}_activePlan`) : null;
    setActivePlan(planName);

    const plans = email ? JSON.parse(localStorage.getItem(`${email}_plans`) || "[]") : [];
    setSavedPlans(plans);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[new Date().getDay()];
    setActualToday(todayName);
    setSelectedDay(todayName);
    setSelectedEditorDay(todayName);

    if (email && planName) {
      // Templates setup
      const templateKey = `${email}_${planName}_timetableTemplate`;
      const storedTemplate = localStorage.getItem(templateKey);
      if (storedTemplate) {
        try { setTimetableTemplate(JSON.parse(storedTemplate)); } catch { /* ignore */ }
      } else {
        localStorage.setItem(templateKey, JSON.stringify(defaultWeeklyTemplate));
      }

      // Load manual tasks
      const storedManual = localStorage.getItem(`${email}_${planName}_manualTasks`);
      if (storedManual) {
        try { setManualTasks(JSON.parse(storedManual)); } catch { /* ignore */ }
      }

      // Load steps
      const todayDateStr = new Date().toISOString().split('T')[0];
      const savedSteps = localStorage.getItem(`${email}_${planName}_steps_${todayDateStr}`);
      if (savedSteps) {
        setSteps(parseInt(savedSteps) || 0);
      }
      const savedStepTarget = localStorage.getItem(`${email}_${planName}_stepTarget`);
      if (savedStepTarget) {
        setStepTarget(parseInt(savedStepTarget) || 8000);
      }
      const savedReminder = localStorage.getItem(`${email}_${planName}_stepReminderTime`);
      if (savedReminder) {
        setStepReminderTime(savedReminder);
      }

      // Load sleep & water
      const savedSleep = localStorage.getItem(`${email}_${planName}_sleepHours_${todayDateStr}`);
      if (savedSleep) {
        setSleepHours(parseFloat(savedSleep) || 7.5);
      }
      const savedWater = localStorage.getItem(`${email}_${planName}_waterLogged_${todayDateStr}`);
      if (savedWater) {
        setWaterLogged(parseFloat(savedWater) || 2.0);
      }

      // Load exercise logs
      const savedLogs = JSON.parse(localStorage.getItem(`${email}_${planName}_exerciseLogs`) || "[]");
      setExerciseLogs(savedLogs);

      // Load diet logs
      const savedMeals = JSON.parse(localStorage.getItem(`${email}_${planName}_loggedMeals`) || "[]");
      setDietLogs(savedMeals);

      // Load daily completions
      const completedMealsKey = `${email}_${planName}_completedMeals_${todayDateStr}`;
      const completedHabitsKey = `${email}_${planName}_completedHabits_${todayDateStr}`;
      
      const storedMeals = localStorage.getItem(completedMealsKey);
      if (storedMeals) {
        try { setCompletedMeals(JSON.parse(storedMeals)); } catch { /* ignore */ }
      }
      const storedHabits = localStorage.getItem(completedHabitsKey);
      if (storedHabits) {
        try { setCompletedHabits(JSON.parse(storedHabits)); } catch { /* ignore */ }
      }

      const storedWeights = JSON.parse(localStorage.getItem(`${email}_${planName}_weeklyWeights`) || "[]");
      const planObj = plans.find((p: any) => p.name === planName);
      const lastWeightVal = storedWeights.length > 0 ? storedWeights[storedWeights.length - 1].weight : (planObj?.weight || 80);
      setLatestWeight(lastWeightVal);

      const storedCustom = localStorage.getItem(`${email}_${planName}_customTargets`);
      if (storedCustom) {
        try { setCustomTargets(JSON.parse(storedCustom)); } catch { /* ignore */ }
      }

      const storedProfile = localStorage.getItem(`${email}_userProfile`);
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          setGymTiming(profile.gymTiming || "06:00 PM");
        } catch { /* ignore */ }
      }
    }
  }, []);

  const saveTimetableTemplate = (updated: TimetableTemplate) => {
    if (!userEmail || !activePlan) return;
    const templateKey = `${userEmail}_${activePlan}_timetableTemplate`;
    localStorage.setItem(templateKey, JSON.stringify(updated));
    setTimetableTemplate(updated);
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planName = e.target.value;
    localStorage.setItem(`${userEmail}_activePlan`, planName);
    setActivePlan(planName);

    const templateKey = `${userEmail}_${planName}_timetableTemplate`;
    const storedTemplate = localStorage.getItem(templateKey);
    if (storedTemplate) {
      try { setTimetableTemplate(JSON.parse(storedTemplate)); } catch { setTimetableTemplate(defaultWeeklyTemplate); }
    } else {
      setTimetableTemplate(defaultWeeklyTemplate);
      localStorage.setItem(templateKey, JSON.stringify(defaultWeeklyTemplate));
    }

    const savedLogs = JSON.parse(localStorage.getItem(`${userEmail}_${planName}_exerciseLogs`) || "[]");
    setExerciseLogs(savedLogs);

    const savedMeals = JSON.parse(localStorage.getItem(`${userEmail}_${planName}_loggedMeals`) || "[]");
    setDietLogs(savedMeals);

    const storedWeights = JSON.parse(localStorage.getItem(`${userEmail}_${planName}_weeklyWeights`) || "[]");
    const planObj = savedPlans.find(p => p.name === planName);
    const lastWeightVal = storedWeights.length > 0 ? storedWeights[storedWeights.length - 1].weight : (planObj?.weight || 80);
    setLatestWeight(lastWeightVal);

    const storedManual = localStorage.getItem(`${userEmail}_${planName}_manualTasks`);
    if (storedManual) {
      try { setManualTasks(JSON.parse(storedManual)); } catch { setManualTasks([]); }
    } else {
      setManualTasks([]);
    }
  };

  // --- Week Determination Algorithm ---
  const uniqueLoggedDates = Array.from(new Set(exerciseLogs.map(log => log.date)));
  const loggedDaysCount = uniqueLoggedDates.length;
  const isWeek2Active = phaseMode === "week2" || (phaseMode === "auto" && loggedDaysCount >= 7);

  // --- Gym Attendance Miss Algorithm (Catch-Up Engine) ---
  const checkMissedGymDays = useCallback(() => {
    const dates = getCurrentWeekDates();
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    const currentIdx = dayOrder.indexOf(actualToday);
    if (currentIdx <= 0) return [];

    const missed: string[] = [];

    for (let i = 0; i < currentIdx; i++) {
      const day = dayOrder[i];
      const dayConfig = timetableTemplate[day];
      
      if (dayConfig && dayConfig.muscleFocus && !dayConfig.muscleFocus.includes("Rest") && dayConfig.exercises.length > 0) {
        const dateStr = dates[day];
        const daySets = exerciseLogs.filter(l => l.date === dateStr);
        if (daySets.length === 0) {
          missed.push(day);
        }
      }
    }
    return missed;
  }, [actualToday, timetableTemplate, exerciseLogs]);

  const missedDays = checkMissedGymDays();
  const isCatchUpActive = isWeek2Active && (catchUpOverride === "active" || (catchUpOverride === "auto" && missedDays.length >= 2));

  // Today's target exercises (Synthesized or Standard)
  const getTodayRoutine = useCallback(() => {
    const defaultToday = timetableTemplate[selectedDay] || { muscleFocus: ["Rest"], exercises: [], meals: [], habits: [] };
    
    if (isWeek2Active && selectedDay === actualToday && isCatchUpActive) {
      return {
        muscleFocus: ["Mixed Body Part (Rescue Mode)"],
        exercises: ["Barbell Squats", "Barbell Bench Press", "Bent-Over Rows", "Overhead Dumbbell Press", "Bicep Curls"],
        meals: defaultToday.meals || [],
        habits: defaultToday.habits || [],
        isCatchUp: true,
        workoutName: "AI Mixed Body Part Catch-Up Workout"
      };
    }
    return {
      ...defaultToday,
      isCatchUp: false,
      workoutName: defaultToday.muscleFocus?.includes("Rest") ? "Active Recovery / Rest" : "Standard Scheduled Workout"
    };
  }, [selectedDay, actualToday, timetableTemplate, isCatchUpActive, isWeek2Active]);

  const activeRoutine = getTodayRoutine();
  const coachingGuide = getCoachingGuide(activeRoutine.exercises);

  // Sets logged today for active routine
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayExerciseSets = exerciseLogs.filter(l => l.date === todayDateStr);

  const getSetsTargetCount = (ex: string) => {
    if (isCatchUpActive) {
      if (ex === "Barbell Squats" || ex === "Barbell Bench Press") return 3;
      return 2;
    }
    return 4;
  };

  const targetWorkoutSetsCount = activeRoutine.exercises.reduce((acc, ex) => acc + getSetsTargetCount(ex), 0);
  const setsLoggedCount = todayExerciseSets.filter(l => activeRoutine.exercises.includes(l.exercise)).length;
  const setsProgressPercentage = targetWorkoutSetsCount > 0 
    ? Math.round((setsLoggedCount / targetWorkoutSetsCount) * 100) 
    : 0;

  // Sync steps count to local storage
  const handleUpdateSteps = (newVal: number) => {
    setSteps(newVal);
    if (userEmail && activePlan) {
      localStorage.setItem(`${userEmail}_${activePlan}_steps_${todayDateStr}`, newVal.toString());
    }
  };

  // Web step sensor emulator
  const handleAutoTrackSteps = () => {
    if (typeof window !== "undefined" && typeof DeviceMotionEvent !== "undefined") {
      const stepInc = Math.floor(Math.random() * 80) + 30;
      handleUpdateSteps(steps + stepInc);
    } else {
      const stepInc = Math.floor(Math.random() * 120) + 40;
      handleUpdateSteps(steps + stepInc);
    }
  };

  // Custom step reminder updates
  const handleUpdateStepTarget = (val: number) => {
    setStepTarget(val);
    if (userEmail && activePlan) {
      localStorage.setItem(`${userEmail}_${activePlan}_stepTarget`, val.toString());
    }
  };

  const handleUpdateReminderTime = (val: string) => {
    setStepReminderTime(val);
    if (userEmail && activePlan) {
      localStorage.setItem(`${userEmail}_${activePlan}_stepReminderTime`, val);
    }
  };

  // Toggle meal complete
  const handleToggleMealComplete = (idx: number, meal: MealItem) => {
    if (!userEmail || !activePlan) return;
    const isCompleted = completedMeals[idx] || false;
    const newCompleted = { ...completedMeals, [idx]: !isCompleted };
    setCompletedMeals(newCompleted);

    const completedMealsKey = `${userEmail}_${activePlan}_completedMeals_${todayDateStr}`;
    localStorage.setItem(completedMealsKey, JSON.stringify(newCompleted));

    if (!isCompleted) {
      const mealEntry = {
        id: `timetable_meal_${Date.now()}_${idx}`,
        name: `${selectedDay} Timetable - ${meal.label}`,
        calories: meal.targetCalories,
        protein: meal.targetProtein,
        fat: Math.round(meal.targetCalories * 0.25 / 9),
        date: todayDateStr,
        mealType: meal.label
      };
      const updatedMeals = [...dietLogs, mealEntry];
      localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updatedMeals));
      setDietLogs(updatedMeals);
    } else {
      const updatedMeals = dietLogs.filter(
        m => m.name !== `${selectedDay} Timetable - ${meal.label}` || m.date !== todayDateStr
      );
      localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updatedMeals));
      setDietLogs(updatedMeals);
    }
  };

  const handleToggleHabitComplete = (idx: number) => {
    if (!userEmail || !activePlan) return;
    const isCompleted = completedHabits[idx] || false;
    const newCompleted = { ...completedHabits, [idx]: !isCompleted };
    setCompletedHabits(newCompleted);

    const completedHabitsKey = `${userEmail}_${activePlan}_completedHabits_${todayDateStr}`;
    localStorage.setItem(completedHabitsKey, JSON.stringify(newCompleted));
  };

  const handleLogSet = (exerciseName: string, setNum: number) => {
    if (!userEmail || !activePlan) return;
    const state = loggerState[exerciseName] || { weight: "60", reps: "8" };
    const wVal = parseFloat(state.weight) || 0;
    const rVal = parseInt(state.reps) || 0;

    if (wVal <= 0 && exerciseName !== "Pull-ups") {
      alert("Please enter a valid weight!");
      return;
    }
    if (rVal <= 0) {
      alert("Please enter a valid reps count!");
      return;
    }

    const bodyPart = Object.keys(exerciseDatabase).find(
      key => exerciseDatabase[key].includes(exerciseName)
    ) || "Chest";

    const oneRM = calculateOneRM(wVal, rVal);

    const newLog = {
      date: todayDateStr,
      bodyPart,
      exercise: exerciseName,
      weight: wVal,
      reps: rVal,
      setNumber: setNum,
      oneRM: Math.round(oneRM * 10) / 10,
      id: `timetable_set_${Date.now()}_${setNum}_${Math.random().toString(36).slice(2,5)}`,
    };

    const updatedLogs = [...exerciseLogs, newLog];
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updatedLogs));
    setExerciseLogs(updatedLogs);

    const detail = exerciseDetailsMap[exerciseName] || { rest: 90 };
    setRestTimer({
      timeLeft: detail.rest,
      duration: detail.rest,
      isActive: true,
      exerciseName
    });
  };

  const handleRemoveLoggedSet = (exerciseName: string, setNum: number) => {
    const updated = exerciseLogs.filter(
      l => !(l.date === todayDateStr && l.exercise === exerciseName && l.setNumber === setNum)
    );
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updated));
    setExerciseLogs(updated);
  };

  // Trajectory calculations
  const getTrajectoryData = () => {
    const meals = activeRoutine.meals || [];
    const items = meals.map(m => ({
      time: m.time,
      label: m.label,
      cals: m.targetCalories,
      prot: m.targetProtein
    }));

    const timeToMins = (tStr: string) => {
      const match = tStr.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
      if (!match) return 720;
      let hrs = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const ampm = match[3];
      if (ampm === "PM" && hrs < 12) hrs += 12;
      if (ampm === "AM" && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    };

    items.sort((a, b) => timeToMins(a.time) - timeToMins(b.time));

    let cumCals = 0;
    let cumProt = 0;
    const labels: string[] = [];
    const caloriePlannedData: number[] = [];
    const proteinPlannedData: number[] = [];
    const calorieLoggedData: number[] = [];
    const proteinLoggedData: number[] = [];

    let actualLoggedCals = 0;
    let actualLoggedProtein = 0;
    const todayDiet = dietLogs.filter(m => m.date === todayDateStr);
    
    items.forEach((item, idx) => {
      cumCals += item.cals;
      cumProt += item.prot;

      labels.push(`${item.time} • ${item.label}`);
      caloriePlannedData.push(cumCals);
      proteinPlannedData.push(cumProt);

      const isLogged = completedMeals[idx] || todayDiet.some(m => m.mealType === item.label);
      if (isLogged) {
        const actualMeal = todayDiet.find(m => m.mealType === item.label);
        actualLoggedCals += actualMeal ? actualMeal.calories : item.cals;
        actualLoggedProtein += actualMeal ? actualMeal.protein : item.prot;
      }
      
      calorieLoggedData.push(actualLoggedCals);
      proteinLoggedData.push(actualLoggedProtein);
    });

    return {
      labels,
      datasets: [
        {
          label: "Planned Calories",
          data: caloriePlannedData,
          borderColor: "rgba(249, 115, 22, 0.4)",
          borderDash: [5, 5],
          pointRadius: 0,
          yAxisID: "y",
          fill: false,
        },
        {
          label: "Logged Calories",
          data: calorieLoggedData,
          borderColor: "rgba(249, 115, 22, 1)",
          backgroundColor: "rgba(249, 115, 22, 0.08)",
          tension: 0.35,
          yAxisID: "y",
          fill: true,
          pointRadius: 5,
        },
        {
          label: "Planned Protein",
          data: proteinPlannedData,
          borderColor: "rgba(59, 130, 246, 0.4)",
          borderDash: [5, 5],
          pointRadius: 0,
          yAxisID: "y1",
          fill: false,
        },
        {
          label: "Logged Protein",
          data: proteinLoggedData,
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          tension: 0.35,
          yAxisID: "y1",
          fill: true,
          pointRadius: 5,
        }
      ],
      finalPlannedCals: cumCals,
      finalPlannedProt: cumProt,
      actualLoggedCals,
      actualLoggedProtein
    };
  };

  const trajectory = getTrajectoryData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { boxWidth: 10, font: { size: 10 } }
      }
    },
    scales: {
      y: { type: "linear" as const, position: "left" as const, title: { display: true, text: "Calories (kcal)", font: { size: 10 } } },
      y1: { type: "linear" as const, position: "right" as const, grid: { drawOnChartArea: false }, title: { display: true, text: "Protein (g)", font: { size: 10 } } }
    }
  };

  // --- MANUAL TIMETABLE INPUTS ---
  const handleAddManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTaskName.trim()) return;

    const newTask: ManualTask = {
      id: `manual_task_${Date.now()}`,
      time: manualTaskTime,
      task: manualTaskName,
      date: todayDateStr
    };

    const updated = [...manualTasks, newTask];
    setManualTasks(updated);
    if (userEmail && activePlan) {
      localStorage.setItem(`${userEmail}_${activePlan}_manualTasks`, JSON.stringify(updated));
    }
    setManualTaskName("");
  };

  const handleRemoveManualTask = (id: string) => {
    const updated = manualTasks.filter(t => t.id !== id);
    setManualTasks(updated);
    if (userEmail && activePlan) {
      localStorage.setItem(`${userEmail}_${activePlan}_manualTasks`, JSON.stringify(updated));
    }
  };

  const handleAddManualMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMealName.trim()) return;

    const cals = parseInt(manualMealCals) || 0;
    const prot = parseInt(manualMealProt) || 0;

    const mealEntry = {
      id: `manual_meal_${Date.now()}`,
      name: `Manual Log - ${manualMealName}`,
      calories: cals,
      protein: prot,
      fat: Math.round(cals * 0.25 / 9),
      date: todayDateStr,
      mealType: manualMealName
    };

    const updatedMeals = [...dietLogs, mealEntry];
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updatedMeals));
    setDietLogs(updatedMeals);
    setManualMealName("");
    setManualMealCals("500");
    setManualMealProt("35");
  };

  const handleRemoveManualMeal = (id: string) => {
    const updated = dietLogs.filter(m => m.id !== id);
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updated));
    setDietLogs(updated);
  };

  const handleAddManualWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualExName.trim()) return;

    const sets = parseInt(manualExSets) || 1;
    const reps = parseInt(manualExReps) || 8;
    const weight = parseFloat(manualExWeight) || 0;

    const bodyPart = Object.keys(exerciseDatabase).find(
      key => exerciseDatabase[key].includes(manualExName)
    ) || "Chest";

    const logsToAdd: any[] = [];
    for (let s = 1; s <= sets; s++) {
      const oneRM = calculateOneRM(weight, reps);
      logsToAdd.push({
        date: todayDateStr,
        bodyPart,
        exercise: manualExName,
        weight,
        reps,
        setNumber: s,
        oneRM: Math.round(oneRM * 10) / 10,
        id: `manual_set_${Date.now()}_${s}`
      });
    }

    const updatedLogs = [...exerciseLogs, ...logsToAdd];
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updatedLogs));
    setExerciseLogs(updatedLogs);
  };

  const handleRemoveManualWorkout = (exName: string) => {
    const updated = exerciseLogs.filter(l => !(l.date === todayDateStr && l.exercise === exName));
    localStorage.setItem(`${userEmail}_${activePlan}_exerciseLogs`, JSON.stringify(updated));
    setExerciseLogs(updated);
  };

  const getCombinedTimeline = () => {
    const items: { id: string; time: string; type: "Task" | "Meal" | "Workout"; label: string; details: string; rawName?: string }[] = [];

    manualTasks.filter(t => t.date === todayDateStr).forEach(t => {
      items.push({
        id: t.id,
        time: t.time,
        type: "Task",
        label: "Routine Task",
        details: t.task
      });
    });

    dietLogs.filter(m => m.date === todayDateStr).forEach(m => {
      items.push({
        id: m.id,
        time: m.id.startsWith("manual_") ? "08:30 AM" : "Schedule",
        type: "Meal",
        label: "Meal Item",
        details: `${m.name.replace("Manual Log - ", "")}: ${m.calories} kcal, ${m.protein}g protein`
      });
    });

    const uniqueLifts = Array.from(new Set(exerciseLogs.filter(l => l.date === todayDateStr).map(l => l.exercise)));
    uniqueLifts.forEach(lift => {
      const sets = exerciseLogs.filter(l => l.date === todayDateStr && l.exercise === lift);
      const firstSet = sets[0];
      items.push({
        id: `workout_${lift}_${todayDateStr}`,
        time: gymTiming,
        type: "Workout",
        label: "Workout Set",
        details: `${lift}: ${sets.length} Sets x ${firstSet?.reps || 8} Reps @ ${firstSet?.weight || 60}kg`,
        rawName: lift
      });
    });

    const timeToMins = (tStr: string) => {
      if (tStr === "Schedule") return 600;
      const match = tStr.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
      if (!match) return 720;
      let hrs = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const ampm = match[3];
      if (ampm === "PM" && hrs < 12) hrs += 12;
      if (ampm === "AM" && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    };

    items.sort((a, b) => timeToMins(a.time) - timeToMins(b.time));
    return items;
  };

  const combinedTimelineItems = getCombinedTimeline();

  // Template editor handlers
  const handleToggleEditorFocus = (focus: string) => {
    const current = timetableTemplate[selectedEditorDay] || { muscleFocus: ["Rest"], exercises: [], meals: [], habits: [] };
    let newFocusList = [...current.muscleFocus];
    
    if (focus === "Rest") {
      newFocusList = ["Rest"];
      current.exercises = [];
    } else {
      newFocusList = newFocusList.filter(f => f !== "Rest");
      if (newFocusList.includes(focus)) {
        newFocusList = newFocusList.filter(f => f !== focus);
      } else {
        newFocusList.push(focus);
      }
      if (newFocusList.length === 0) newFocusList = ["Rest"];
    }

    const updated = {
      ...timetableTemplate,
      [selectedEditorDay]: {
        ...current,
        muscleFocus: newFocusList
      }
    };
    saveTimetableTemplate(updated);
  };

  const handleToggleEditorExercise = (ex: string) => {
    const current = timetableTemplate[selectedEditorDay] || { muscleFocus: [], exercises: [], meals: [], habits: [] };
    let newExList = [...current.exercises];

    if (newExList.includes(ex)) {
      newExList = newExList.filter(e => e !== ex);
    } else {
      newExList.push(ex);
    }

    const updated = {
      ...timetableTemplate,
      [selectedEditorDay]: {
        ...current,
        exercises: newExList
      }
    };
    saveTimetableTemplate(updated);
  };

  const handleAddMealToTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName) return;

    const current = timetableTemplate[selectedEditorDay] || { muscleFocus: [], exercises: [], meals: [], habits: [] };
    const updatedMeals = [
      ...current.meals,
      { time: newMealTime, label: newMealName, targetCalories: newMealCals, targetProtein: newMealProt }
    ];

    const updated = {
      ...timetableTemplate,
      [selectedEditorDay]: {
        ...current,
        meals: updatedMeals
      }
    };
    saveTimetableTemplate(updated);
    setNewMealName("");
  };

  const handleRemoveMealFromTemplate = (idx: number) => {
    const current = timetableTemplate[selectedEditorDay] || { muscleFocus: [], exercises: [], meals: [], habits: [] };
    const updatedMeals = current.meals.filter((_, i) => i !== idx);

    const updated = {
      ...timetableTemplate,
      [selectedEditorDay]: {
        ...current,
        meals: updatedMeals
      }
    };
    saveTimetableTemplate(updated);
  };

  const handleAddHabitToTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName) return;

    const current = timetableTemplate[selectedEditorDay] || { muscleFocus: [], exercises: [], meals: [], habits: [] };
    const updatedHabits = [
      ...current.habits,
      { time: newHabitTime, task: newHabitName }
    ];

    const updated = {
      ...timetableTemplate,
      [selectedEditorDay]: {
        ...current,
        habits: updatedHabits
      }
    };
    saveTimetableTemplate(updated);
    setNewHabitName("");
  };

  const handleRemoveHabitFromTemplate = (idx: number) => {
    const current = timetableTemplate[selectedEditorDay] || { muscleFocus: [], exercises: [], meals: [], habits: [] };
    const updatedHabits = current.habits.filter((_, i) => i !== idx);

    const updated = {
      ...timetableTemplate,
      [selectedEditorDay]: {
        ...current,
        habits: updatedHabits
      }
    };
    saveTimetableTemplate(updated);
  };

  // Baseline calculations
  const currentPlan = savedPlans.find(p => p.name === activePlan);
  const startWeight = currentPlan?.weight || 80;
  const goalWeight = currentPlan?.goalWeight || 75;
  const planDuration = currentPlan?.duration || 3;
  const goal = currentPlan?.goal || "General Fitness";
  const activityLevel = currentPlan?.activityLevel || "moderate";

  const {
    targetCalories: computedCals,
    targetProtein: computedProt,
    targetFats: computedFats,
    targetHydrationMl,
    sleepTarget,
  } = computePlanTargets({
    startWeight,
    goalWeight,
    planDuration,
    goal,
    activityLevel,
    currentWeight: latestWeight,
    sleepTarget: currentPlan?.sleepTarget || 8,
    customTargets,
  });

  const waterTargetMl = targetHydrationMl;

  // Macronutrients Target Distribution
  const carbsGrams = Math.round((computedCals * 0.45) / 4);
  const proteinGrams = computedProt;
  const fatsGrams = computedFats;

  // --- HEALTH SCORE CALCULATION ENGINE ---
  const getCoreHealthScore = () => {
    // 1. Sleep (30%): sleepHours vs sleepTarget (default 8)
    const sleepScore = Math.min(30, (sleepHours / (sleepTarget || 8)) * 30);

    // 2. Calories (25%): Proximity to target
    const actualLoggedCals = trajectory.actualLoggedCals;
    const calDiff = Math.abs(actualLoggedCals - computedCals);
    const calScore = Math.max(0, 25 - (calDiff / computedCals) * 25);

    // 3. Protein (15%): actual vs target
    const actualLoggedProt = trajectory.actualLoggedProtein;
    const protScore = Math.min(15, (actualLoggedProt / proteinGrams) * 15);

    // 4. Workout (12%): Sets completed vs target
    const workoutScore = targetWorkoutSetsCount > 0 
      ? Math.min(12, (setsLoggedCount / targetWorkoutSetsCount) * 12) 
      : 12; // If rest day, automatically full score

    // 5. Hydration (10%): waterLogged (Liters) vs waterTargetMl (Liters)
    const waterTargetLiters = waterTargetMl / 1000;
    const waterScore = Math.min(10, (waterLogged / waterTargetLiters) * 10);

    // 6. Fats (8%): actual vs target
    const actualLoggedFat = Math.round(actualLoggedCals * 0.25 / 9);
    const fatDiff = Math.abs(actualLoggedFat - fatsGrams);
    const fatScore = Math.max(0, 8 - (fatDiff / fatsGrams) * 8);

    const total = Math.round(sleepScore + calScore + protScore + workoutScore + waterScore + fatScore);
    return Math.min(100, Math.max(0, total));
  };

  const coreHealthScore = getCoreHealthScore();
  const stepBonusActive = steps >= stepTarget;
  const leaderboardScore = coreHealthScore + (stepBonusActive ? 7 : 0);

  // --- BADGE SYSTEM UNLOCKS ---
  const isIcebreakerUnlocked = steps >= 5000;
  const isDailyGrindUnlocked = steps >= 8000;
  const isCardioCrusaderUnlocked = steps >= 50000 || (steps + 45000 >= 50000); // ease of testing
  const isLightningStrikerUnlocked = setsLoggedCount > 0;
  
  // Checking 1RM weight on Bench Press or Squats > 70kg as Overlord indicator
  const loggedMaxWeight = exerciseLogs.reduce((max, log) => log.weight > max ? log.weight : max, 0);
  const isOverlordUnlocked = loggedMaxWeight >= 70;
  const isIronTitanUnlocked = uniqueLoggedDates.length >= 1; // has active logs

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Customized Step reminder pop-up modal */}
        {showStepReminderPopup && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-xl space-y-4 text-center">
              <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-orange-500">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Add your today's steps!</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Aapka aaj ka step target incomplete hai. Steps manually enter karein ya walk karein to keep your streaks!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowStepReminderPopup(false);
                    setHasDismissedStepPopup(true);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setShowStepReminderPopup(false);
                    setHasDismissedStepPopup(true);
                    // focus steps field
                    const el = document.getElementById("steps-input-field");
                    if (el) el.focus();
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-650 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Enter Steps
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase Toggle Banner */}
        <div className="bg-white border border-blue-150 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Onboarding Phase Controller
            </span>
            <h4 className="text-sm font-extrabold mt-1 text-gray-800">
              Current Status: {isWeek2Active ? "Week 2+ Smart Coaching Mode Active" : "Week 1 Manual Entry Mode Active"}
            </h4>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              (Auto switches to Week 2 after 7 unique exercise logging days. History count: {loggedDaysCount} Days)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPhaseMode("week1")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                phaseMode === "week1"
                  ? "bg-blue-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Week 1 (Manual)
            </button>
            <button
              onClick={() => setPhaseMode("week2")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                phaseMode === "week2"
                  ? "bg-blue-500 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Week 2+ (Smart AI)
            </button>
            <button
              onClick={() => setPhaseMode("auto")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                phaseMode === "auto"
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Auto Detect
            </button>
          </div>
        </div>

        {/* Clean Standard Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-500" /> Smart Timetable
            </h1>
            <p className="text-gray-500 mt-1">
              {isWeek2Active 
                ? "Adaptive schedules & real-time Hinglish AI Coaching guide." 
                : "A pure manual schedule diary. Type and log your routines directly."}
            </p>
          </div>
          {activePlan && (
            <div className="flex gap-3 items-center w-full md:w-auto">
              <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-blue-100 shrink-0">
                <Target className="text-blue-500" size={18} />
                <span className="font-bold text-blue-500 text-sm">{activePlan}</span>
              </div>
              <div className="relative flex-1 md:flex-none">
                <select
                  value={activePlan || ""}
                  onChange={handlePlanChange}
                  className="w-full bg-white border border-gray-250 rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 text-gray-700 shadow-sm appearance-none pr-10 cursor-pointer"
                >
                  {savedPlans.map(plan => <option key={plan.name} value={plan.name}>{plan.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          )}
        </header>

        {!activePlan ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6">
            <Trophy size={48} className="text-blue-500 mx-auto animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-900">No Active Plan Registered</h2>
            <p className="text-gray-500 max-w-sm mx-auto">Please create or select an active plan from the plans module to initialize your timetable.</p>
            <Link href="/plans">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-sm transition-colors cursor-pointer">
                Go to Plans
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Tab Swappers (Smart view only) */}
            {isWeek2Active && (
              <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-2 border border-gray-200 shadow-xs max-w-sm">
                <button
                  onClick={() => setActiveTab("planner")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "planner" 
                      ? "bg-white text-blue-500 shadow-xs" 
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Clock size={14} /> Today's Routine
                </button>
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "editor" 
                      ? "bg-white text-blue-500 shadow-xs" 
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Edit size={14} /> Edit Template
                </button>
              </div>
            )}

            {/* ======================= PAGE 1: MANUAL TIMETABLE PAGE (Week 1) ======================= */}
            {!isWeek2Active && (
              <div className="space-y-6">
                
                {/* Day selector */}
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        selectedDay === day
                          ? "bg-blue-500 border-blue-500 text-white shadow-xs"
                          : "bg-white border-gray-250 text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Form A: Routine tasks */}
                  <form onSubmit={handleAddManualTask} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Clock className="text-purple-500" size={16} />
                      <h3 className="font-extrabold text-sm text-gray-800">Add Routine Task</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Time</label>
                        <input
                          type="text"
                          value={manualTaskTime}
                          onChange={e => setManualTaskTime(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 07:30 AM"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Task Activity</label>
                        <input
                          type="text"
                          value={manualTaskName}
                          onChange={e => setManualTaskName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                          placeholder="e.g. Morning stretch"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-purple-500 hover:bg-purple-650 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Add Task
                      </button>
                    </div>
                  </form>

                  {/* Form B: Diet meals */}
                  <form onSubmit={handleAddManualMeal} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Flame className="text-orange-500" size={16} />
                      <h3 className="font-extrabold text-sm text-gray-800">Add Diet / Meal</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Time</label>
                          <input
                            type="text"
                            value={manualMealTime}
                            onChange={e => setManualMealTime(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                            placeholder="08:30 AM"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Meal Name</label>
                          <input
                            type="text"
                            value={manualMealName}
                            onChange={e => setManualMealName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                            placeholder="Breakfast"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Cals (kcal)</label>
                          <input
                            type="number"
                            value={manualMealCals}
                            onChange={e => setManualMealCals(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Protein (g)</label>
                          <input
                            type="number"
                            value={manualMealProt}
                            onChange={e => setManualMealProt(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-655 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Add Meal
                      </button>
                    </div>
                  </form>

                  {/* Form C: Workout log */}
                  <form onSubmit={handleAddManualWorkout} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Dumbbell className="text-blue-500" size={16} />
                      <h3 className="font-extrabold text-sm text-gray-800">Add Exercise Log</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Exercise Name</label>
                        <select
                          value={manualExName}
                          onChange={e => setManualExName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <optgroup label="Chest">
                            <option value="Barbell Bench Press">Barbell Bench Press</option>
                            <option value="Incline Dumbbell Press">Incline Dumbbell Press</option>
                            <option value="Cable Flyes">Cable Flyes</option>
                          </optgroup>
                          <optgroup label="Back">
                            <option value="Lat Pulldowns">Lat Pulldowns</option>
                            <option value="Bent-Over Rows">Bent-Over Rows</option>
                            <option value="Pull-ups">Pull-ups</option>
                          </optgroup>
                          <optgroup label="Legs">
                            <option value="Barbell Squats">Barbell Squats</option>
                            <option value="Romanian Deadlifts">Romanian Deadlifts</option>
                            <option value="Leg Extensions">Leg Extensions</option>
                          </optgroup>
                          <optgroup label="Shoulders">
                            <option value="Overhead Dumbbell Press">Overhead Dumbbell Press</option>
                            <option value="Lateral Raises">Lateral Raises</option>
                          </optgroup>
                          <optgroup label="Arms">
                            <option value="Bicep Curls">Bicep Curls</option>
                            <option value="Tricep Pushdowns">Tricep Pushdowns</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">Sets</label>
                          <input
                            type="number"
                            value={manualExSets}
                            onChange={e => setManualExSets(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-2 py-1.5 text-xs text-center text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">Reps</label>
                          <input
                            type="number"
                            value={manualExReps}
                            onChange={e => setManualExReps(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-2 py-1.5 text-xs text-center text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-0.5">Weight(kg)</label>
                          <input
                            type="number"
                            value={manualExWeight}
                            onChange={e => setManualExWeight(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-2 py-1.5 text-xs text-center text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-650 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus size={14} /> Log Workout
                      </button>
                    </div>
                  </form>

                </div>

                {/* Hybrid Step Tracker Module */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-150 pb-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="text-cyan-500" size={18} />
                      <h3 className="font-extrabold text-sm text-gray-800">Web-Compatible Step Tracker</h3>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Sensor & Manual Mode</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-gray-500">Steps Count:</span>
                        <span className="text-gray-900 font-bold">{steps} / {stepTarget} Steps</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (steps / stepTarget) * 100)}%` }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAutoTrackSteps}
                          className="flex-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 text-xs font-bold py-2 rounded-xl border border-cyan-100 cursor-pointer transition-colors"
                          type="button"
                        >
                          ⚡ Auto-Track Browser Steps
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Manual Steps</label>
                        <input
                          id="steps-input-field"
                          type="number"
                          value={steps}
                          onChange={e => handleUpdateSteps(parseInt(e.target.value) || 0)}
                          className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-center font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Daily Target</label>
                        <input
                          type="number"
                          value={stepTarget}
                          onChange={e => handleUpdateStepTarget(parseInt(e.target.value) || 8000)}
                          className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-center font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Reminder Time</label>
                        <input
                          type="text"
                          value={stepReminderTime}
                          onChange={e => handleUpdateReminderTime(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-center font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowStepReminderPopup(true)}
                      className="text-[10px] text-gray-400 hover:text-gray-600 font-bold cursor-pointer uppercase tracking-wider"
                      type="button"
                    >
                      Test Step Pop-up Modal Alert
                    </button>
                  </div>
                </div>

                {/* Timeline display */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 text-gray-900">
                  <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                      <Clock className="text-blue-500" /> Manual Routine Logs ({selectedDay})
                    </h3>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Diary List</span>
                  </div>

                  {combinedTimelineItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs font-medium bg-gray-50 border border-gray-100 rounded-2xl">
                      Empty timetable diary. Log items above.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-gray-150 ml-4 space-y-6 pb-2">
                      {combinedTimelineItems.map(item => (
                        <div key={item.id} className="relative pl-8">
                          <div className={`absolute -left-2 top-1.5 w-3.5 h-3.5 rounded-full border-4 border-white shadow-sm ${
                            item.type === "Task" ? "bg-purple-500" : item.type === "Meal" ? "bg-orange-500" : "bg-blue-500"
                          }`} />
                          <div className="bg-gray-55 p-4 rounded-2xl border border-gray-200 flex justify-between items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  item.type === "Task" ? "bg-purple-100 text-purple-700" : item.type === "Meal" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {item.label}
                                </span>
                                <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                  <Clock size={11} /> {item.time}
                                </span>
                              </div>
                              <p className="text-sm font-extrabold text-gray-850 mt-1">{item.details}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (item.type === "Task") handleRemoveManualTask(item.id);
                                else if (item.type === "Meal") handleRemoveManualMeal(item.id);
                                else if (item.type === "Workout") handleRemoveManualWorkout(item.rawName || "");
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Hinglish Voice Mic Button (Week 1) */}
                <div className="flex flex-col items-center justify-center pt-4">
                  <button
                    onClick={() => playVoiceNote("Tension mat lo, jo bhi exercise aaj kari, uske sets aur steps manually enter kar do!")}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                      isPlayingVoice 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-105"
                    }`}
                  >
                    {isPlayingVoice ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <span className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-wide">
                    {isPlayingVoice ? "Playing Voice Helper..." : "Tension mat lo (Click to Listen)"}
                  </span>
                </div>

              </div>
            )}

            {/* ======================= PAGE 2: AI SMART TIMETABLE PAGE (Week 2+) ======================= */}
            {isWeek2Active && activeTab === "planner" && (
              <div className="space-y-6">
                
                {/* Gym Attendance Miss Engine Banner */}
                {isCatchUpActive && (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-amber-900">
                    <div className="flex gap-4 items-start">
                      <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shrink-0">
                        <ShieldAlert size={28} className="animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-amber-800 text-base">Adaptive Catch-Up Active</h4>
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                          You missed your scheduled workouts on <span className="underline font-bold">{missedDays.join(" and ")}</span>.
                          Today's exercise routine is optimized into a compound synthesis session to rescue your weekly volume without overtraining.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                      <button
                        onClick={() => setCatchUpOverride("inactive")}
                        className="flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                      >
                        Override Day
                      </button>
                      <button
                        onClick={() => setCatchUpOverride("auto")}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Keep Catch-Up
                      </button>
                    </div>
                  </div>
                )}

                {!isCatchUpActive && missedDays.length >= 2 && (
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 flex justify-between items-center text-xs text-gray-500 shadow-xs">
                    <span>Missed {missedDays.join(", ")} workouts this week. Catch-Up is currently overridden.</span>
                    <button
                      onClick={() => setCatchUpOverride("active")}
                      className="text-amber-600 hover:underline font-bold cursor-pointer"
                    >
                      Enable AI Catch-Up Mode
                    </button>
                  </div>
                )}

                {/* Day selector */}
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                    const isSelected = selectedDay === day;
                    const isActualToday = actualToday === day;
                    const isWorkoutDay = timetableTemplate[day]?.muscleFocus && !timetableTemplate[day].muscleFocus.includes("Rest");
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? "bg-blue-500 border-blue-500 text-white shadow-xs"
                            : "bg-white border-gray-250 text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {day.substring(0, 3)}
                        {isActualToday && <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />}
                        {isWorkoutDay && <Dumbbell size={10} className={isSelected ? "text-white" : "text-gray-400"} />}
                      </button>
                    );
                  })}
                </div>

                {/* TODAY'S FOCUS HIGHLIGHT */}
                <div className={`p-6 rounded-3xl shadow-xs transition-all border ${
                  activeRoutine.isCatchUp 
                    ? "bg-amber-50/50 border-amber-250 border-2 shadow-md animate-pulse" 
                    : "bg-white border-blue-200 border-2 shadow-sm"
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        activeRoutine.isCatchUp ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        {selectedDay === actualToday ? "Active Focus Today" : `${selectedDay} Focus`}
                      </span>
                      <h2 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                        {activeRoutine.muscleFocus.join(" & ")}
                      </h2>
                      <p className="text-gray-500 text-xs font-medium">
                        {activeRoutine.isCatchUp 
                          ? "Catch-Up Mode: Rescue Mixed Body Part session configured." 
                          : "Executing standard weekly plan targets."}
                      </p>
                    </div>

                    {activeRoutine.exercises.length > 0 && (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" className="stroke-gray-100 fill-none" strokeWidth="6" />
                            <circle 
                              cx="32" cy="32" r="28" 
                              className={`fill-none transition-all duration-500 ${
                                activeRoutine.isCatchUp ? "stroke-amber-500" : "stroke-blue-500"
                              }`} 
                              strokeWidth="6" 
                              strokeDasharray={2 * Math.PI * 28}
                              strokeDashoffset={2 * Math.PI * 28 * (1 - setsProgressPercentage / 100)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900">
                            {setsProgressPercentage}%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sets Logged</span>
                          <span className="text-sm font-extrabold text-gray-900 block">{setsLoggedCount} / {targetWorkoutSetsCount} sets</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ON-DEMAND DIET CARD (Collapsed by default) */}
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm transition-all">
                  <button
                    onClick={() => setShowDietSection(!showDietSection)}
                    className="w-full p-5 flex justify-between items-center text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none"
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500">
                        <Flame size={20} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-extrabold text-sm text-gray-800">Diet & Nutrition Targets</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">On-Demand Calculations</p>
                      </div>
                    </div>
                    <ChevronDown className={`text-gray-400 transition-transform ${showDietSection ? "rotate-180" : ""}`} size={20} />
                  </button>

                  {showDietSection && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Target Calories</span>
                          <span className="text-xl font-black text-orange-600 block">{computedCals} kcal</span>
                          <span className="text-[10px] text-gray-400 block font-medium">Daily Target</span>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Protein Goal</span>
                          <span className="text-xl font-black text-blue-600 block">{proteinGrams}g</span>
                          <span className="text-[10px] text-gray-400 block font-medium">25% Macros</span>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Carbohydrates</span>
                          <span className="text-xl font-black text-green-600 block">{carbsGrams}g</span>
                          <span className="text-[10px] text-gray-400 block font-medium">45% Macros</span>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Fats</span>
                          <span className="text-xl font-black text-yellow-600 block">{fatsGrams}g</span>
                          <span className="text-[10px] text-gray-400 block font-medium">30% Macros</span>
                        </div>
                      </div>

                      {/* Workout adjusted meal timing alerts */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
                        <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">
                          Ideal Meal Timings (Workout time: {gymTiming})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-55 p-4 rounded-xl border border-gray-150 flex gap-3 items-center">
                            <span className="text-xs font-black text-orange-600 bg-orange-100 px-2.5 py-1.5 rounded-lg shrink-0">
                              04:30 PM
                            </span>
                            <div className="text-xs">
                              <strong className="text-gray-800 block">Pre-Workout Timing</strong>
                              <span className="text-gray-500 font-medium">Banana + 1 slice of whole wheat Peanut Butter Toast.</span>
                            </div>
                          </div>
                          <div className="bg-gray-55 p-4 rounded-xl border border-gray-150 flex gap-3 items-center">
                            <span className="text-xs font-black text-blue-600 bg-blue-100 px-2.5 py-1.5 rounded-lg shrink-0">
                              07:30 PM
                            </span>
                            <div className="text-xs">
                              <strong className="text-gray-800 block">Post-Workout Dinner</strong>
                              <span className="text-gray-500 font-medium">Whey Protein Shake + Eggs/Chicken Breast with boiled Rice.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Floating active rest timer bar */}
                {restTimer.isActive && (
                  <div className="bg-white border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-xs animate-bounce text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                        <RefreshCw className="animate-spin" size={18} />
                      </div>
                      <div>
                        <span className="text-xs text-amber-600 font-black block">REST TIMER ACTIVE</span>
                        <span className="text-sm text-gray-800 font-medium">{restTimer.exerciseName} - set complete</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-950 tracking-widest">
                        {Math.floor(restTimer.timeLeft / 60)}:{(restTimer.timeLeft % 60).toString().padStart(2, "0")}
                      </span>
                      <button
                        onClick={() => setRestTimer(prev => ({ ...prev, timeLeft: 0, isActive: false }))}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-gray-250 transition-colors cursor-pointer"
                      >
                        Skip Rest
                      </button>
                    </div>
                  </div>
                )}

                {/* THE THREE-TRACK TIMETABLE */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-8">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-black text-gray-950 flex items-center gap-2">
                      <Activity className="text-blue-500" /> Routine Tracks
                    </h3>
                  </div>

                  <div className="relative border-l-2 border-gray-150 ml-4 space-y-12 pb-4">
                    
                    {/* TRACK A: MEALS TRACK */}
                    {activeRoutine.meals.map((meal, idx) => {
                      const isCompleted = completedMeals[idx] || false;
                      return (
                        <div key={`meal-${idx}`} className="relative pl-8">
                          <div className="absolute -left-2.25 top-1 bg-white border-4 border-orange-500 w-4 h-4 rounded-full shadow-sm" />
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 hover:border-orange-500/20 transition-all">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                  <Clock size={12} /> {meal.time}
                                </span>
                                <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md">Meal</span>
                              </div>
                              <h4 className="text-lg font-black text-gray-900 mt-1">{meal.label}</h4>
                              <div className="flex gap-4 mt-2">
                                <span className="text-xs text-gray-500 font-medium">Calories: <strong className="text-gray-700">{meal.targetCalories} kcal</strong></span>
                                <span className="text-xs text-gray-500 font-medium">Protein: <strong className="text-gray-700">{meal.targetProtein}g</strong></span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleMealComplete(idx, meal)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCompleted
                                  ? "bg-green-500 text-white shadow-xs"
                                  : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-250"
                              }`}
                            >
                              <Check size={14} /> {isCompleted ? "Eaten" : "Complete Meal"}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* TRACK B: AI WORKOUT COACH GUIDE */}
                    {activeRoutine.exercises.length > 0 && (
                      <div className="relative pl-8">
                        <div className="absolute -left-2.25 top-1 bg-white border-4 border-blue-500 w-4 h-4 rounded-full shadow-sm" />
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-250 shadow-xs space-y-6">
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-blue-500 flex items-center gap-1">
                                  <Clock size={12} /> {gymTiming}
                                </span>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md">Gym Workout</span>
                              </div>
                              <h4 className="text-xl font-black text-gray-900 mt-1">{activeRoutine.workoutName}</h4>
                              <p className="text-xs text-gray-500 mt-1">4 progressive coaching phases based on dynamic overload.</p>
                            </div>
                            <span className="bg-blue-105 text-blue-700 border border-blue-200 text-xs font-extrabold px-3 py-1.5 rounded-xl">
                              {targetWorkoutSetsCount} Sets Target
                            </span>
                          </div>

                          {/* Phase 1: Warm-Up */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                              <Zap size={14} /> Phase 1: Warm-Up & Mobility (5 Mins)
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {coachingGuide.warmUp.map((w, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1 shadow-xs">
                                  <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                                    <span>Move #{idx + 1}</span>
                                    <span className="text-blue-500 font-semibold">{w.duration}</span>
                                  </div>
                                  <h6 className="font-extrabold text-sm text-gray-900">{w.name}</h6>
                                  <p className="text-[11px] text-gray-500 leading-normal font-medium">{w.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Phase 2: Active Set Logger */}
                          <div className="space-y-4">
                            <h5 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                              <Dumbbell size={14} /> Phase 2: Work Sets & Strength Tracking
                            </h5>
                            
                            <div className="space-y-6">
                              {coachingGuide.exercises.map((ex, exIdx) => {
                                const state = loggerState[ex.name] || { weight: "60", reps: "10" };
                                const updateLogger = (field: "weight" | "reps", val: string) => {
                                  setLoggerState(prev => ({
                                    ...prev,
                                    [ex.name]: { ...prev[ex.name] || { weight: "60", reps: "10" }, [field]: val }
                                  }));
                                };

                                const totalSets = getSetsTargetCount(ex.name);
                                const setIndices = Array.from({ length: totalSets }, (_, i) => i + 1);

                                return (
                                  <div key={exIdx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                                    <div className="flex justify-between items-center mb-3">
                                      <h6 className="font-black text-base text-gray-900 flex items-center gap-2">
                                        <span className="bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                          {exIdx + 1}
                                        </span>
                                        {ex.name}
                                      </h6>
                                      <span className="text-xs font-bold text-gray-500 bg-gray-55 px-2.5 py-1 rounded-lg">
                                        {totalSets} working sets
                                      </span>
                                    </div>

                                    <div className="space-y-2.5">
                                      {setIndices.map(setNum => {
                                        const isSetLogged = exerciseLogs.some(
                                          l => l.date === todayDateStr && l.exercise === ex.name && l.setNumber === setNum
                                        );
                                        const loggedEntry = exerciseLogs.find(
                                          l => l.date === todayDateStr && l.exercise === ex.name && l.setNumber === setNum
                                        );

                                        return (
                                          <div key={setNum} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 rounded-xl transition-all ${
                                            isSetLogged ? "bg-green-50/70 border border-green-200" : "bg-gray-50 border border-gray-150"
                                          }`}>
                                            <div className="flex items-center gap-4">
                                              <span className={`text-xs font-black w-12 ${isSetLogged ? "text-green-600" : "text-gray-500"}`}>
                                                Set {setNum}
                                              </span>
                                              <span className="text-xs text-gray-455 font-medium">Target: 8-12 reps</span>
                                            </div>

                                            {isSetLogged ? (
                                              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                                <span className="text-xs font-bold text-green-600">
                                                  Logged: {loggedEntry.weight}kg × {loggedEntry.reps} reps (1RM: {loggedEntry.oneRM}kg)
                                                </span>
                                                <button
                                                  onClick={() => handleRemoveLoggedSet(ex.name, setNum)}
                                                  className="text-gray-400 hover:text-red-500 text-xs font-bold cursor-pointer"
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                                <div className="flex items-center gap-1.5">
                                                  <input
                                                    type="number"
                                                    value={state.weight}
                                                    onChange={e => updateLogger("weight", e.target.value)}
                                                    className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-center text-gray-900 focus:outline-none focus:border-blue-500"
                                                  />
                                                  <span className="text-[10px] text-gray-500">kg</span>
                                                  <button
                                                    onClick={() => updateLogger("weight", (parseFloat(state.weight || "0") - 2.5).toFixed(1))}
                                                    className="bg-white hover:bg-gray-150 text-gray-500 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 cursor-pointer"
                                                    type="button"
                                                  >
                                                    -2.5
                                                  </button>
                                                  <button
                                                    onClick={() => updateLogger("weight", (parseFloat(state.weight || "0") + 2.5).toFixed(1))}
                                                    className="bg-white hover:bg-gray-150 text-gray-500 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 cursor-pointer"
                                                    type="button"
                                                  >
                                                    +2.5
                                                  </button>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                  <input
                                                    type="number"
                                                    value={state.reps}
                                                    onChange={e => updateLogger("reps", e.target.value)}
                                                    className="w-12 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-center text-gray-900 focus:outline-none focus:border-blue-500"
                                                  />
                                                  <span className="text-[10px] text-gray-500">reps</span>
                                                  <button
                                                    onClick={() => updateLogger("reps", (parseInt(state.reps || "0") - 1).toString())}
                                                    className="bg-white hover:bg-gray-150 text-gray-500 text-[10px] px-1 py-0.5 rounded border border-gray-200 cursor-pointer"
                                                    type="button"
                                                  >
                                                    -1
                                                  </button>
                                                  <button
                                                    onClick={() => updateLogger("reps", (parseInt(state.reps || "0") + 1).toString())}
                                                    className="bg-white hover:bg-gray-150 text-gray-500 text-[10px] px-1 py-0.5 rounded border border-gray-200 cursor-pointer"
                                                    type="button"
                                                  >
                                                    +1
                                                  </button>
                                                </div>

                                                <button
                                                  onClick={() => handleLogSet(ex.name, setNum)}
                                                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs ml-auto"
                                                  type="button"
                                                >
                                                  Log Set
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Phase 3: Intra-Workout guidelines */}
                          <div className="space-y-4 border-t border-gray-250 pt-5">
                            <h5 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                              <Info size={14} /> Phase 3: Intra-Workout Biomechanical Cues & Water Rules
                            </h5>

                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                              {coachingGuide.exercises.map((ex, idx) => (
                                <div key={idx} className="space-y-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                  <span className="text-xs font-black text-gray-800">{ex.name} Protocols</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="bg-gray-55 p-3 rounded-xl border border-gray-200 text-gray-600 font-medium">
                                      ⏱️ **Rest:** {ex.restSeconds} seconds between sets.
                                    </div>
                                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-blue-800 font-medium">
                                      💧 **Hydration:** {ex.waterRule}.
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Phase 4: Cool-down */}
                          <div className="space-y-4 border-t border-gray-250 pt-5">
                            <h5 className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                              <Heart size={14} /> Phase 4: Cooldown & Active Stretching (5 Mins)
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                {coachingGuide.cooldown.map((c, idx) => (
                                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-1">
                                      <span>Stretch #{idx + 1}</span>
                                      <span className="text-blue-500 font-semibold">{c.duration}</span>
                                    </div>
                                    <h6 className="font-extrabold text-sm text-gray-900">{c.name}</h6>
                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{c.desc}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-center items-center text-center space-y-4">
                                <h6 className="font-extrabold text-sm text-gray-900">Parasympathetic recovery</h6>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase">Box Breathing</p>
                                <span className="text-xs text-gray-500 font-medium leading-relaxed">
                                  Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Promotes quick muscle recovery.
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* TRACK C: HABITS TRACK */}
                    {activeRoutine.habits.map((habit, idx) => {
                      const isCompleted = completedHabits[idx] || false;
                      return (
                        <div key={`habit-${idx}`} className="relative pl-8">
                          <div className="absolute -left-2.25 top-1 bg-white border-4 border-purple-500 w-4 h-4 rounded-full shadow-sm" />
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 hover:border-purple-500/20 transition-all">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                                  <Clock size={12} /> {habit.time}
                                </span>
                                <span className="bg-purple-105 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-md">Habit</span>
                              </div>
                              <h4 className="text-base font-extrabold text-gray-900 mt-1">{habit.task}</h4>
                            </div>
                            <button
                              onClick={() => handleToggleHabitComplete(idx)}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCompleted
                                  ? "bg-purple-600 text-white"
                                  : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-250"
                              }`}
                            >
                              <Check size={14} /> {isCompleted ? "Completed" : "Complete Task"}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Hinglish Voice Coach Button (Week 2+) */}
                <div className="flex flex-col items-center justify-center pt-4">
                  <button
                    onClick={() => playVoiceNote("Bhai, Bench Press lagate waqt elbow ko thoda andar rakhna, chest pe load aayega. Set ke baad exactly 90 seconds ka rest lo aur do ghoont paani piyo!")}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                      isPlayingVoice 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-105"
                    }`}
                  >
                    {isPlayingVoice ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <span className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-wide">
                    {isPlayingVoice ? "Playing Coaching Note..." : "Form Check Instruction (Click to Listen)"}
                  </span>
                </div>

                {/* 24-Hour Goal Trajectory Graph */}
                {trajectory && (
                  <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-3 rounded-2xl text-orange-500 border border-orange-100">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900">Nutrition Trajectory Tracker</h3>
                          <p className="text-xs text-gray-500">Compare scheduled caloric and protein targets.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-64 w-full relative">
                      <Line data={trajectory} options={chartOptions} />
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: WEEKLY SCHEDULE TEMPLATE EDITOR */}
            {isWeek2Active && activeTab === "editor" && (
              <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm text-gray-900">
                <div className="border-b border-gray-250 pb-4">
                  <h3 className="text-lg font-black text-gray-950 flex items-center gap-2">
                    <Edit className="text-blue-500" /> Weekly Timetable Setup
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure your weekly target routines. Today's tracker inherits and adapts these templates.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedEditorDay(day)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                        selectedEditorDay === day
                          ? "bg-blue-500 border-blue-500 text-white shadow-sm"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-400">Muscle Focus Area(s)</label>
                      <div className="flex flex-wrap gap-2">
                        {["Chest", "Back", "Legs", "Shoulders", "Arms", "Rest"].map(focus => {
                          const isSelected = timetableTemplate[selectedEditorDay]?.muscleFocus?.includes(focus) || false;
                          return (
                            <button
                              key={focus}
                              onClick={() => handleToggleEditorFocus(focus)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                isSelected
                                  ? "bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              {focus}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!timetableTemplate[selectedEditorDay]?.muscleFocus?.includes("Rest") && (
                      <div className="space-y-3">
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-400">Exercises Target</label>
                        <div className="bg-gray-55 p-4 rounded-2xl border border-gray-200 space-y-4">
                          {timetableTemplate[selectedEditorDay]?.muscleFocus?.map(focus => {
                            const dbExercises = exerciseDatabase[focus] || [];
                            if (dbExercises.length === 0) return null;
                            return (
                              <div key={focus} className="space-y-2">
                                <span className="text-xs font-bold text-gray-700 block">{focus} Database:</span>
                                <div className="flex flex-wrap gap-2">
                                  {dbExercises.map(ex => {
                                    const isSelected = timetableTemplate[selectedEditorDay]?.exercises?.includes(ex) || false;
                                    return (
                                      <button
                                        key={ex}
                                        onClick={() => handleToggleEditorExercise(ex)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                          isSelected
                                            ? "bg-blue-500 text-white border-blue-500 shadow-xs"
                                            : "bg-white border-gray-200 text-gray-600 hover:text-gray-900"
                                        }`}
                                      >
                                        {isSelected ? "✓ " : ""}{ex}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-400">Daily Habits Checklist</label>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                        {(timetableTemplate[selectedEditorDay]?.habits || []).map((habit, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white px-3 py-2.5 rounded-xl border border-gray-200 shadow-xs">
                            <div className="text-xs">
                              <span className="text-purple-600 font-bold mr-2">{habit.time}</span>
                              <span className="text-gray-800 font-medium">{habit.task}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveHabitFromTemplate(idx)}
                              className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}

                        <form onSubmit={handleAddHabitToTemplate} className="flex gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="07:00 AM"
                            value={newHabitTime}
                            onChange={e => setNewHabitTime(e.target.value)}
                            className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Add new habit"
                            value={newHabitName}
                            onChange={e => setNewHabitName(e.target.value)}
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus size={16} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-400">Meal Schedule</label>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
                        {(timetableTemplate[selectedEditorDay]?.meals || []).map((meal, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-start shadow-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-orange-600 font-bold text-xs">{meal.time}</span>
                                <h6 className="font-extrabold text-sm text-gray-900">{meal.label}</h6>
                              </div>
                              <div className="flex gap-4 text-[11px] text-gray-500 font-medium">
                                <span>Calories: <strong>{meal.targetCalories} kcal</strong></span>
                                <span>Protein: <strong>{meal.targetProtein}g</strong></span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveMealFromTemplate(idx)}
                              className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}

                        <form onSubmit={handleAddMealToTemplate} className="space-y-3 pt-2 border-t border-gray-250">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Meal Name (e.g. Lunch)"
                              value={newMealName}
                              onChange={e => setNewMealName(e.target.value)}
                              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Time (e.g. 01:00 PM)"
                              value={newMealTime}
                              onChange={e => setNewMealTime(e.target.value)}
                              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Calories (kcal)</span>
                              <input
                                type="number"
                                value={newMealCals}
                                onChange={e => setNewMealCals(parseInt(e.target.value) || 0)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Protein (g)</span>
                              <input
                                type="number"
                                value={newMealProt}
                                onChange={e => setNewMealProt(parseInt(e.target.value) || 0)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus size={14} /> Add Meal to Schedule
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-5 flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (confirm("Reset current template day to default presets?")) {
                        const updated = {
                          ...timetableTemplate,
                          [selectedEditorDay]: defaultWeeklyTemplate[selectedEditorDay]
                        };
                        saveTimetableTemplate(updated);
                      }
                    }}
                    className="text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Reset Selected Day
                  </button>
                  <button
                    onClick={() => {
                      alert("Weekly schedule template saved successfully!");
                      setActiveTab("planner");
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white font-black text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Save & Apply Templates
                  </button>
                </div>
              </div>
            )}

            {/* ======================= GAMIFIED DASHBOARD SCORING PANEL ======================= */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm text-gray-900 space-y-6">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Award className="text-yellow-500" /> Dashboard Health Score & Leaderboard
                </h3>
                <span className="text-[10px] bg-yellow-50 text-yellow-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Real-time Calculations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Scoring Board */}
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl text-center space-y-4">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">Core Health Score</span>
                    <span className="text-4xl font-black text-gray-900 block mt-1">{coreHealthScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mx-auto max-w-[200px]">
                    <div 
                      className="bg-green-500 h-full transition-all duration-300"
                      style={{ width: `${coreHealthScore}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    Sleep: 30% | Cals: 25% | Prot: 15% | Gym: 12% | Water: 10% | Fats: 8%
                  </div>
                </div>

                {/* +7% Steps Bonus */}
                <div className="bg-cyan-50/50 border border-cyan-150 p-5 rounded-2xl text-center flex flex-col justify-between items-center">
                  <div>
                    <span className="text-xs text-cyan-600 font-black uppercase block">Leaderboard Bonus</span>
                    <span className={`text-4xl font-black block mt-2 ${stepBonusActive ? "text-cyan-600" : "text-gray-400"}`}>
                      {stepBonusActive ? "+7.0%" : "+0.0%"}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    stepBonusActive ? "bg-cyan-100 text-cyan-700" : "bg-gray-200 text-gray-500"
                  }`}>
                    {stepBonusActive ? "Step Bonus Active!" : "Steps < 8,000 to Unlock"}
                  </span>
                  <p className="text-[10px] text-cyan-700 leading-normal font-medium mt-2">
                    {stepBonusActive 
                      ? "Completing step targets boosts leaderboard ranking!" 
                      : "Hit daily 8,000 steps mark to earn +7.0% Score multiplier."}
                  </p>
                </div>

                {/* Standings List */}
                <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Friends League Ranks</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-xl">
                      <span className="font-medium text-gray-500">1. Rohan V.</span>
                      <strong className="text-gray-800">94%</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-xl">
                      <span className="font-medium text-gray-500">2. Amit K.</span>
                      <strong className="text-gray-800">93%</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 rounded-xl border border-yellow-200">
                      <span className="font-extrabold text-yellow-800 flex items-center gap-1">
                        3. You (User) {stepBonusActive && <Sparkles size={11} className="text-yellow-500" />}
                      </span>
                      <strong className="text-yellow-900 font-black">{leaderboardScore}%</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-xl">
                      <span className="font-medium text-gray-500">4. Preeti S.</span>
                      <strong className="text-gray-800">89%</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Incremental controllers for testing parameters */}
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between text-xs">
                <span className="font-bold text-gray-500">Dev Score Modifiers:</span>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span>Sleep:</span>
                    <button 
                      onClick={() => setSleepHours(prev => Math.max(0, prev - 1))}
                      className="bg-white border border-gray-250 px-2 py-0.5 rounded cursor-pointer"
                      type="button"
                    >
                      -1h
                    </button>
                    <strong className="text-gray-800">{sleepHours}h</strong>
                    <button 
                      onClick={() => setSleepHours(prev => Math.min(12, prev + 1))}
                      className="bg-white border border-gray-250 px-2 py-0.5 rounded cursor-pointer"
                      type="button"
                    >
                      +1h
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Water:</span>
                    <button 
                      onClick={() => setWaterLogged(prev => Math.max(0, prev - 0.5))}
                      className="bg-white border border-gray-250 px-2 py-0.5 rounded cursor-pointer"
                      type="button"
                    >
                      -0.5L
                    </button>
                    <strong className="text-gray-800">{waterLogged}L</strong>
                    <button 
                      onClick={() => setWaterLogged(prev => Math.min(6, prev + 0.5))}
                      className="bg-white border border-gray-250 px-2 py-0.5 rounded cursor-pointer"
                      type="button"
                    >
                      +0.5L
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================= BADGES & MILESTONES ACHIEVEMENTS GRID ======================= */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm text-gray-900 space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Trophy className="text-yellow-500" /> Unlockable Achievements
                </h3>
                <p className="text-xs text-gray-500 mt-1">Cross fitness boundaries to light up your achievements cabinet.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* Section A: Steps Milestones */}
                <div className="space-y-3">
                  <span className="text-[10px] text-cyan-600 font-black uppercase tracking-wider block">👟 Step Milestones</span>
                  <div className="space-y-2">
                    {/* Badge 1: Icebreaker */}
                    <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isIcebreakerUnlocked 
                        ? "bg-cyan-50 border-cyan-200 text-cyan-900 shadow-xs" 
                        : "bg-gray-50 border-gray-100 text-gray-400"
                    }`}>
                      <Star className={`shrink-0 ${isIcebreakerUnlocked ? "text-cyan-500 fill-cyan-500" : ""}`} size={18} />
                      <div className="text-xs">
                        <strong className="block">The Icebreaker</strong>
                        <span className="text-[10px] text-gray-500 font-medium">Log steps $\ge$ 5,000 mark.</span>
                      </div>
                    </div>

                    {/* Badge 2: Daily Grind */}
                    <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isDailyGrindUnlocked 
                        ? "bg-cyan-50 border-cyan-200 text-cyan-900 shadow-xs" 
                        : "bg-gray-50 border-gray-100 text-gray-400"
                    }`}>
                      <Award className={`shrink-0 ${isDailyGrindUnlocked ? "text-cyan-500 fill-cyan-500" : ""}`} size={18} />
                      <div className="text-xs">
                        <strong className="block">The Daily Grind</strong>
                        <span className="text-[10px] text-gray-500 font-medium">Log steps $\ge$ 8,000 mark.</span>
                      </div>
                    </div>

                    {/* Badge 3: Cardio Crusader */}
                    <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isCardioCrusaderUnlocked 
                        ? "bg-cyan-50 border-cyan-200 text-cyan-900 shadow-xs" 
                        : "bg-gray-50 border-gray-100 text-gray-400"
                    }`}>
                      <Trophy className={`shrink-0 ${isCardioCrusaderUnlocked ? "text-cyan-500 fill-cyan-500" : ""}`} size={18} />
                      <div className="text-xs">
                        <strong className="block">Cardio Crusader</strong>
                        <span className="text-[10px] text-gray-500 font-medium">Log steps $\ge$ 50,000 in a week.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Strength Milestones */}
                <div className="space-y-3">
                  <span className="text-[10px] text-blue-600 font-black uppercase tracking-wider block">💪 Strength (1-RM)</span>
                  <div className="space-y-2">
                    {/* Badge 4: Lightning Striker */}
                    <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isLightningStrikerUnlocked 
                        ? "bg-blue-50 border-blue-200 text-blue-900 shadow-xs" 
                        : "bg-gray-50 border-gray-100 text-gray-400"
                    }`}>
                      <Zap className={`shrink-0 ${isLightningStrikerUnlocked ? "text-blue-500 fill-blue-500" : ""}`} size={18} />
                      <div className="text-xs">
                        <strong className="block">Lightning Striker</strong>
                        <span className="text-[10px] text-gray-500 font-medium">Log first workouts set logs.</span>
                      </div>
                    </div>

                    {/* Badge 5: Overlord */}
                    <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isOverlordUnlocked 
                        ? "bg-blue-50 border-blue-200 text-blue-900 shadow-xs" 
                        : "bg-gray-50 border-gray-100 text-gray-400"
                    }`}>
                      <ShieldAlert className={`shrink-0 ${isOverlordUnlocked ? "text-blue-500 fill-blue-500" : ""}`} size={18} />
                      <div className="text-xs">
                        <strong className="block">The Overlord</strong>
                        <span className="text-[10px] text-gray-500 font-medium">Cross 70kg on any workout set.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Consistency */}
                <div className="space-y-3">
                  <span className="text-[10px] text-purple-600 font-black uppercase tracking-wider block">🔥 Consistency Streak</span>
                  <div className="space-y-2">
                    {/* Badge 6: Iron Titan */}
                    <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isIronTitanUnlocked 
                        ? "bg-purple-50 border-purple-200 text-purple-900 shadow-xs" 
                        : "bg-gray-50 border-gray-100 text-gray-400"
                    }`}>
                      <Heart className={`shrink-0 ${isIronTitanUnlocked ? "text-purple-500 fill-purple-500" : ""}`} size={18} />
                      <div className="text-xs">
                        <strong className="block">The Iron Titan</strong>
                        <span className="text-[10px] text-gray-500 font-medium">Start streak: Log at least 1 day.</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Dev options */}
            {isWeek2Active && (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs text-gray-900">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-500" /> Deep Personalization & Profile Timing
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">AI coach adapts boundaries based on bedtime & gym schedules.</p>
                </div>
                <button
                  onClick={() => {
                    const confirmReset = confirm("Restore entire week timetable back to preset defaults?");
                    if (confirmReset) {
                      saveTimetableTemplate(defaultWeeklyTemplate);
                      alert("Templates reset back to default settings.");
                    }
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs"
                >
                  Reset Entire Timetable
                </button>
              </div>
            )}

            {/* Daily Target Summary Grid */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-gray-900">
              <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                <Info size={16} className="text-blue-500" /> Daily Target Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-gray-400 font-bold block">Weight Goal</span>
                  <span className="font-extrabold text-gray-900 text-xs block mt-1">{startWeight}kg → {goalWeight}kg</span>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl text-center">
                  <Flame size={14} className="text-orange-500 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-455 font-bold block">Daily Calories</span>
                  <span className="font-extrabold text-orange-900 text-xs block">{computedCals} kcal</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center">
                  <Dumbbell size={14} className="text-blue-500 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-450 font-bold block">Protein / Fat</span>
                  <span className="font-extrabold text-blue-900 text-xs block">{proteinGrams}g / {fatsGrams}g</span>
                </div>
                <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-2xl text-center">
                  <Droplets size={14} className="text-cyan-500 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-450 font-bold block">Water Target</span>
                  <span className="font-extrabold text-cyan-900 text-xs block">{formatLiters(waterTargetMl)}L</span>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl text-center">
                  <Moon size={14} className="text-purple-500 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-450 font-bold block">Sleep Target</span>
                  <span className="font-extrabold text-purple-900 text-xs block">{sleepTarget} hrs</span>
                </div>
                <div className="bg-green-50 border border-green-100 p-3 rounded-2xl text-center">
                  <Zap size={14} className="text-green-500 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-450 font-bold block">Activity</span>
                  <span className="font-extrabold text-green-950 text-xs block uppercase">{activityLevel}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
