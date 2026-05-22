"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, Clock } from "lucide-react";
import { formatMacroValue } from "@/utils/oneRM";

export default function DayDetail({ params }: { params: { dayIndex: string } }) {
  const [dayData, setDayData] = useState<any | null>(null);
  const [loaded, setLoaded] = useState(false);

  // compute water target using same formula as daily-routine
  const computeWaterTarget = (weightKg: number, goal: string, activityLevel: string) => {
    const base = weightKg * 35;
    const gainGoal = /muscle|bulk|gain/i.test(goal);
    const goalBonus = gainGoal ? 500 : 0;
    const multipliers: Record<string, number> = { sedentary: 1.0, light: 1.1, moderate: 1.2, active: 1.3 };
    const multiplier = multipliers[activityLevel?.toLowerCase()] ?? 1.0;
    return Math.round((base + goalBonus) * multiplier);
  };

  const computeTargetsFromPlan = () => {
    const email = localStorage.getItem("userEmail") || "";
    const planName = localStorage.getItem(`${email}_activePlan`) || "";
    const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
    const plan = plans.find((p: any) => p.name === planName) || null;
    if (!plan) return null;
    const startWeight = plan.weight || 80;
    const goalWeight = plan.goalWeight || startWeight;
    const planDuration = plan.duration || 3;
    const goal = plan.goal || "General Fitness";
    const activityLevel = plan.activityLevel || "moderate";

    const goalWeightLbs = goalWeight * 2.20462;
    const maintenanceTDEE = goalWeightLbs * 15;
    const dailyCalorieAdjustment = ((goalWeight - startWeight) * 2.20462 * 3500) / (planDuration * 30);
    let targetCalories = Math.round(maintenanceTDEE + dailyCalorieAdjustment);
    if (targetCalories < 1200 && startWeight > goalWeight) targetCalories = 1200;

    const targetProtein = Math.round(startWeight * 1.8);
    const targetFats = Math.round(goalWeightLbs * 0.4);
    const targetWater = computeWaterTarget(startWeight, goal, activityLevel);

    return { targetCalories, targetProtein, targetFats, targetWater };
  };

  useEffect(() => {
    const idx = parseInt(params.dayIndex || "0", 10);
    const email = localStorage.getItem("userEmail") || "";
    const plan = localStorage.getItem(`${email}_activePlan`) || "";
    if (!email || !plan) {
      setDayData(null);
      setLoaded(true);
      return;
    }
    const reports = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || "[]");
    const day = reports[idx];
    setDayData(day || null);
    setLoaded(true);
  }, [params.dayIndex]);

  if (!loaded) return <div className="p-6">Loading…</div>;

  if (!dayData) {
    return (
      <div className="p-6">
        <Link href="/reports" className="inline-flex items-center gap-2 text-sm text-blue-500 mb-4">
          <ArrowLeft size={16} /> Back to Reports
        </Link>
        <div className="mt-6 bg-white p-6 rounded-xl border border-gray-100">
          <h2 className="text-lg font-bold">Day not found</h2>
          <p className="text-sm text-gray-500 mt-2">That summary could not be found. It may have been deleted or the index is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/reports" className="inline-flex items-center gap-2 text-sm text-blue-500">
            <ArrowLeft size={16} /> Back to Reports
          </Link>
          <div className="text-sm text-gray-500">{dayData.date}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Calendar size={20} className="text-blue-500" />
            </div>
            <h1 className="text-xl font-bold">Daily Summary — {dayData.date}</h1>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500">Score</div>
              <div className="font-bold text-lg">{dayData.score}%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500">Weight</div>
              <div className="font-bold text-lg">{dayData.weight ? `${dayData.weight} kg` : 'N/A'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500">Date</div>
              <div className="font-bold text-lg">{dayData.date}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500">Diet</div>
              <div className="font-bold text-lg">{dayData.diet || (dayData.meals ? `${(dayData.meals || []).length} items` : 'N/A')}</div>
            </div>
          </div>

          {/* Macro / Micro breakdown with weighted progress */}
          <div className="mt-2">
            {(() => {
              const targets = computeTargetsFromPlan();
              const metrics = [
                { key: 'sleepHours', label: 'Sleep', pct: 30, unit: 'h', target: 8, value: dayData.sleepHours ?? 0 },
                { key: 'calories', label: 'Calories', pct: 25, unit: 'kcal', target: targets?.targetCalories ?? 2619, value: dayData.calories ?? 0 },
                { key: 'protein', label: 'Protein', pct: 15, unit: 'g', target: targets?.targetProtein ?? 121, value: dayData.protein ?? 0 },
                { key: 'workout', label: 'Workout', pct: 12, unit: 'sets', target: dayData.expectedSets ?? 6, value: (dayData.exercises?.reduce((acc: any, e: any) => acc + (e.sets || 0), 0) || 0) },
                { key: 'water', label: 'Hydration', pct: 10, unit: 'L', target: ((targets?.targetWater ?? 3500) / 1000), value: ((dayData.water ?? 0) / 1000) },
                { key: 'fats', label: 'Fats', pct: 8, unit: 'g', target: targets?.targetFats ?? 66, value: dayData.fat ?? 0 },
              ];

              return (
                <div className="space-y-3">
                  {metrics.map((m) => {
                    const ratio = m.target > 0 ? Math.min(1, m.value / m.target) : 0;
                    const percentFill = Math.round(ratio * 100);
                    const displayValue = typeof m.value === 'number'
                      ? m.unit === 'L'
                        ? `${formatMacroValue(m.value)} / ${formatMacroValue(m.target)}${m.unit}`
                        : m.unit === 'g'
                          ? `${formatMacroValue(m.value)} / ${formatMacroValue(m.target)}${m.unit}`
                          : `${m.value} / ${m.target}${m.unit}`
                      : `${m.value} / ${m.target}${m.unit}`;
                    return (
                      <div key={m.key} className="bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-semibold">{m.label} <span className="text-xs text-gray-400">({m.pct}%)</span></div>
                          <div className="text-xs text-gray-600 font-medium">{displayValue}</div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-linear-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: `${percentFill}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <section className="mt-4">
            <h3 className="font-bold mb-2">Exercises</h3>
            {dayData.exercises && dayData.exercises.length > 0 ? (
              <div className="space-y-3">
                {dayData.exercises.map((ex: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold">{ex.name}</div>
                      <div className="text-sm text-gray-600">Best: {ex.bestWeight || '-'} kg</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Sets: {ex.sets || 0} · Reps: {ex.reps || '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No exercises logged.</div>
            )}
          </section>

          {dayData.notes && (
            <section className="mt-4">
              <h3 className="font-bold mb-2">Notes</h3>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700">{dayData.notes}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
