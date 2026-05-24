"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Scale, Ruler, Activity, Save, Flame, Zap, Droplet, Heart, ChevronDown, ChevronUp, BookOpen, ArrowRight, AlertTriangle, CalendarClock } from "lucide-react";

type MeasurementUnit = "cm" | "in";

const defaultBodyMetrics = {
  bicepsLeft: "",
  bicepsRight: "",
  waist: "",
  thighLeft: "",
  thighRight: "",
  shoulderWidth: "",
  forearmLeft: "",
  forearmRight: "",
  chest: "",
  calfLeft: "",
  calfRight: "",
};

export default function YourMetrics() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [bmi, setBmi] = useState("0.0");
  const [bmiStatus, setBmiStatus] = useState("Unknown");
  const [userEmail, setUserEmail] = useState("");
  const [showScience, setShowScience] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>("cm");
  const [bodyMetrics, setBodyMetrics] = useState(defaultBodyMetrics);
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState<string | null>(null);

  // Dynamic calculations on render
  const weightNum = parseFloat(weight) || 0;
  const heightNum = parseFloat(height) || 0;
  const ageNum = parseInt(age) || 0;

  // 1. Basal Metabolic Rate (BMR) - Revised Harris-Benedict
  let bmr = 0;
  if (weightNum && heightNum && ageNum) {
    if (gender === "Male") {
      bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
    } else {
      bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.33 * ageNum);
    }
  }

  // 2. Total Daily Energy Expenditure (TDEE)
  let tdee = 0;
  if (bmr) {
    const multipliers: Record<string, number> = {
      "sedentary": 1.2,
      "light": 1.375,
      "moderate": 1.55,
      "active": 1.725,
      "very active": 1.9
    };
    const key = activityLevel.toLowerCase();
    const mult = multipliers[key] || 1.55;
    tdee = bmr * mult;
  }

  // 3. Lean Body Mass (Boer Formula)
  let lbm = 0;
  if (weightNum && heightNum) {
    if (gender === "Male") {
      lbm = (0.407 * weightNum) + (0.267 * heightNum) - 19.2;
    } else {
      lbm = (0.252 * weightNum) + (0.473 * heightNum) - 48.3;
    }
    lbm = Math.min(weightNum, Math.max(0, lbm));
  }

  // 4. Body Fat Percentage Estimate
  let bodyFat = 0;
  if (weightNum && lbm) {
    bodyFat = ((weightNum - lbm) / weightNum) * 100;
  }

  // 5. Ideal Daily Hydration Base
  let idealWater = 0;
  if (weightNum) {
    idealWater = weightNum * 35;
    if (activityLevel.toLowerCase() !== "sedentary") {
      idealWater += 500;
    }
  }

  const convertToUnit = (value: number, from: MeasurementUnit, to: MeasurementUnit) => {
    if (from === to) return value;
    return from === "cm" ? value / 2.54 : value * 2.54;
  };

  const convertBodyMetricsToUnit = (values: typeof defaultBodyMetrics, from: MeasurementUnit, to: MeasurementUnit) => {
    const converted = { ...values };
    Object.keys(converted).forEach((key) => {
      const typedKey = key as keyof typeof defaultBodyMetrics;
      const raw = converted[typedKey];
      if (!raw) return;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return;
      converted[typedKey] = convertToUnit(parsed, from, to).toFixed(1);
    });
    return converted;
  };

  const daysSinceLastUpdate = lastMetricsUpdate
    ? Math.floor((Date.now() - new Date(lastMetricsUpdate).getTime()) / (1000 * 60 * 60 * 24))
    : Number.POSITIVE_INFINITY;

  const metricsReminder = !lastMetricsUpdate
    ? "Monthly metrics are due now. Update your body measurements to keep your progress visible."
    : daysSinceLastUpdate >= 30
      ? "Your monthly body metrics are overdue. Please update them today."
      : daysSinceLastUpdate >= 25
        ? "Your monthly body metrics are due soon."
        : "Monthly body metrics are up to date.";

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    if (email) {
      const metrics = JSON.parse(localStorage.getItem(`${email}_metrics`) || "{}");
      const savedUnit = metrics.measurementUnit === "in" ? "in" : "cm";
      setMeasurementUnit(savedUnit);
      setWeight(metrics.weight || localStorage.getItem("userWeight") || "");
      setHeight(metrics.height || localStorage.getItem("userHeight") || "");
      setAge(metrics.age || "");
      setGender(metrics.gender || "Male");
      setActivityLevel(metrics.activityLevel || "Moderate");
      setLastMetricsUpdate(metrics.lastUpdated || null);

      const storedBodyMetricsCm = metrics.bodyMetricsCm || {};
      const convertedBodyMetrics = convertBodyMetricsToUnit(
        { ...defaultBodyMetrics, ...Object.fromEntries(Object.entries(storedBodyMetricsCm).map(([key, value]) => [key, String(value)])) },
        "cm",
        savedUnit
      );
      setBodyMetrics(convertedBodyMetrics);

      if (metrics.weight && metrics.height) {
        calculateBmi(metrics.weight, metrics.height);
      } else if (localStorage.getItem("userWeight") && localStorage.getItem("userHeight")) {
        calculateBmi(localStorage.getItem("userWeight")!, localStorage.getItem("userHeight")!);
      }
    }
  }, []);

  const calculateBmi = (w: string, h: string) => {
    const weightNum = parseFloat(w);
    const heightNum = parseFloat(h) / 100;
    if (weightNum && heightNum) {
      const bmiVal = Math.round(weightNum / (heightNum * heightNum)).toString();
      setBmi(bmiVal);
      const val = parseFloat(bmiVal);
      if (val < 18.5) setBmiStatus("Underweight");
      else if (val < 25) setBmiStatus("Healthy");
      else if (val < 30) setBmiStatus("Overweight");
      else setBmiStatus("Obese");
    }
  };

  const handleUnitChange = (nextUnit: MeasurementUnit) => {
    setBodyMetrics((current) => convertBodyMetricsToUnit(current, measurementUnit, nextUnit));
    setMeasurementUnit(nextUnit);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    const bodyMetricsCm = Object.fromEntries(
      Object.entries(bodyMetrics).map(([key, value]) => {
        const typedKey = key as keyof typeof defaultBodyMetrics;
        if (!value) return [key, ""];
        const parsed = Number(value);
        return [key, convertToUnit(parsed, measurementUnit, "cm").toFixed(1)];
      })
    );

    const metrics = {
      weight,
      height,
      age,
      gender,
      activityLevel,
      measurementUnit,
      bodyMetricsCm,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(`${userEmail}_metrics`, JSON.stringify(metrics));
    // Also save to global keys for backward compatibility/simplicity in plan page
    localStorage.setItem("userWeight", weight);
    localStorage.setItem("userHeight", height);
    setLastMetricsUpdate(metrics.lastUpdated);

    calculateBmi(weight, height);
    alert("Metrics saved successfully!");
  };

  const bodyMetricGroups = [
    {
      title: "Upper Body",
      fields: [
        { key: "bicepsLeft", label: "Biceps (Left)" },
        { key: "bicepsRight", label: "Biceps (Right)" },
        { key: "forearmLeft", label: "Forearms (Left)" },
        { key: "forearmRight", label: "Forearms (Right)" },
        { key: "chest", label: "Chest" },
        { key: "shoulderWidth", label: "Shoulder Width" },
      ],
    },
    {
      title: "Core & Waist",
      fields: [{ key: "waist", label: "Waist" }],
    },
    {
      title: "Lower Body",
      fields: [
        { key: "thighLeft", label: "Thighs / Legs (Left)" },
        { key: "thighRight", label: "Thighs / Legs (Right)" },
        { key: "calfLeft", label: "Calves (Left)" },
        { key: "calfRight", label: "Calves (Right)" },
      ],
    },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <header className="max-w-4xl mx-auto flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Your Metrics</h1>
          <p className="text-gray-500 mt-1">Track monthly body measurements, keep your reminders on schedule, and explore how your training is affecting progress.</p>
        </div>
        <Link
          href="/visualise"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-xl shadow-sm hover:border-blue-500 transition-colors"
        >
          View Progress Graphs
          <ArrowRight size={16} />
        </Link>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
            <Scale size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Current Weight</span>
            <p className="text-xl font-bold text-gray-900">{weight || "--"} kg</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
            <Ruler size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Height</span>
            <p className="text-xl font-bold text-gray-900">{height || "--"} cm</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Calculated BMI</span>
            <p className="text-xl font-bold text-gray-900">{bmi}</p>
            <span className={`text-xs font-medium ${bmiStatus === 'Healthy' ? 'text-green-500' : 'text-blue-500'}`}>{bmiStatus}</span>
          </div>
        </div>
      </div>

      {/* Scientific Performance Baselines Panel */}
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-500" /> Scientific Baselines & Body Composition
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time biometric analytics computed using peer-reviewed physiological models.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* BMR Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 rounded-xl border border-orange-100/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-orange-700 uppercase tracking-wider">BMR (Metabolic Rate)</span>
              <Flame size={16} className="text-orange-500" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-black text-gray-900">
                {bmr ? Math.round(bmr).toLocaleString() : "--"}
              </span>
              <span className="text-xs text-gray-500 font-bold ml-1">kcal/day</span>
            </div>
            <p className="text-[10px] text-orange-950/60 mt-2 font-medium leading-relaxed">
              Energy expended at absolute rest in a temperate environment.
            </p>
          </div>

          {/* TDEE Card */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50/30 p-4 rounded-xl border border-red-100/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">TDEE (Daily Needs)</span>
              <Zap size={16} className="text-red-500" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-black text-gray-900">
                {tdee ? Math.round(tdee).toLocaleString() : "--"}
              </span>
              <span className="text-xs text-gray-500 font-bold ml-1">kcal/day</span>
            </div>
            <p className="text-[10px] text-red-950/60 mt-2 font-medium leading-relaxed">
              Total energy required to maintain weight based on activity multiplier.
            </p>
          </div>

          {/* LBM Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 p-4 rounded-xl border border-emerald-100/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Lean Body Mass</span>
              <Heart size={16} className="text-emerald-500" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-black text-gray-900">
                {lbm ? Math.round(lbm) : "--"}
              </span>
              <span className="text-xs text-gray-500 font-bold ml-1">kg</span>
            </div>
            <p className="text-[10px] text-emerald-950/60 mt-2 font-medium leading-relaxed">
              Total weight of skeleton, muscles, organs, and water (excl. body fat).
            </p>
          </div>

          {/* Body Fat Card */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50/30 p-4 rounded-xl border border-blue-100/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Est. Body Fat %</span>
              <Scale size={16} className="text-blue-500" />
            </div>
            <div className="mt-1">
              <span className="text-2xl font-black text-gray-900">
                {bodyFat ? `${Math.round(bodyFat)}%` : "--"}
              </span>
            </div>
            <p className="text-[10px] text-blue-950/60 mt-2 font-medium leading-relaxed">
              Estimated body fat percentage based on Boer Lean Mass model.
            </p>
          </div>
        </div>

        {/* Ideal Hydration Row */}
        {idealWater > 0 && (
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white p-2 rounded-lg">
                <Droplet size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-950">Recommended Baseline Hydration</h4>
                <p className="text-[10px] text-gray-500">Calculated using physiological guidelines + activity bonuses</p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xl font-black text-blue-600">
                {Math.round(idealWater).toLocaleString()}
              </span>
              <span className="text-xs text-blue-600 font-bold ml-1">ml / day</span>
            </div>
          </div>
        )}

        {/* Peer-Reviewed Formulas Reference Accordion */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setShowScience(!showScience)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5"><BookOpen size={14} /> Peer-Reviewed Physiology Reference Equations</span>
            {showScience ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showScience && (
            <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-200/50 text-[10px] text-gray-600 space-y-3 font-mono leading-relaxed">
              <div>
                <span className="font-bold text-gray-800">1. Basal Metabolic Rate (BMR) - Revised Harris-Benedict:</span>
                <p className="pl-3 mt-1">Male: BMR = 88.362 + (13.397 * Weight_kg) + (4.799 * Height_cm) - (5.677 * Age_years)</p>
                <p className="pl-3">Female: BMR = 447.593 + (9.247 * Weight_kg) + (3.098 * Height_cm) - (4.330 * Age_years)</p>
              </div>
              <div>
                <span className="font-bold text-gray-800">2. Lean Body Mass (LBM) - Boer Formula:</span>
                <p className="pl-3 mt-1">Male: LBM = (0.407 * Weight_kg) + (0.267 * Height_cm) - 19.2</p>
                <p className="pl-3">Female: LBM = (0.252 * Weight_kg) + (0.473 * Height_cm) - 48.3</p>
              </div>
              <div>
                <span className="font-bold text-gray-800">3. Body Fat Estimate (%):</span>
                <p className="pl-3 mt-1">BF% = ((Weight - LBM) / Weight) * 100</p>
              </div>
              <div>
                <span className="font-bold text-gray-800">4. Total Daily Energy Expenditure (TDEE):</span>
                <p className="pl-3 mt-1">TDEE = BMR * Multiplier (Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725, Very Active: 1.9)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Monthly measurements reminder</p>
            <p className="text-sm text-amber-800 mt-1">{metricsReminder}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-amber-900">
          <CalendarClock size={16} />
          {lastMetricsUpdate ? `Last updated ${new Date(lastMetricsUpdate).toLocaleDateString()}` : "No update saved yet"}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-4xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Update Metrics</h2>
            <p className="text-sm text-gray-500 mt-1">Save your latest measurements and set your preferred unit for this check-in.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Unit</label>
            <select
              value={measurementUnit}
              onChange={(e) => handleUnitChange(e.target.value as MeasurementUnit)}
              className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="cm">Centimeters</option>
              <option value="in">Inches</option>
            </select>
          </div>
        </div>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input 
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input 
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 175"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input 
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
            <select 
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Sedentary">Sedentary (Little or no exercise)</option>
              <option value="Light">Light (1-3 days/week)</option>
              <option value="Moderate">Moderate (3-5 days/week)</option>
              <option value="Active">Active (6-7 days/week)</option>
              <option value="Very Active">Very Active (Athlete)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="border-t border-gray-100 pt-4 mt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Body Measurements</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {bodyMetricGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">{group.title}</p>
                    {group.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} ({measurementUnit})</label>
                        <input
                          type="number"
                          step="0.1"
                          value={bodyMetrics[field.key as keyof typeof defaultBodyMetrics]}
                          onChange={(e) =>
                            setBodyMetrics((current) => ({
                              ...current,
                              [field.key]: e.target.value,
                            }))
                          }
                          placeholder={measurementUnit === "cm" ? "e.g. 32.5" : "e.g. 12.8"}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save size={18} /> Save Metrics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
