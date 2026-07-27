"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Download, ListChecks, ArrowLeft } from "lucide-react";

export default function ExerciseHistoryPage() {
  const [userEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("userEmail") || "";
  });

  const [activePlan] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const email = localStorage.getItem("userEmail") || "";
    return email ? localStorage.getItem(`${email}_activePlan`) : null;
  });

  const [exerciseLogs] = useState<Record<string, unknown>[]>(() => {
    if (typeof window === "undefined") return [];
    const email = localStorage.getItem("userEmail") || "";
    const plan = email ? localStorage.getItem(`${email}_activePlan`) : null;
    const logs = plan ? JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]") : [];
    return Array.isArray(logs) ? logs : [];
  });

  const exerciseSummary = useMemo(() => {
    const byExercise: Record<string, { bodyPart: string; completedSets: number; completedDays: Set<string>; maxWeight: number }> = {};
    exerciseLogs.forEach((log) => {
      const name = log.exercise || "Unknown Exercise";
      const bodyPart = log.bodyPart || "Unknown";
      const date = log.date || "Unknown";
      if (!byExercise[name]) {
        byExercise[name] = { bodyPart, completedSets: 0, completedDays: new Set(), maxWeight: 0 };
      }
      byExercise[name].completedSets += 1;
      byExercise[name].completedDays.add(date);
      if (typeof log.weight === "number" && log.weight > byExercise[name].maxWeight) {
        byExercise[name].maxWeight = log.weight;
      }
      if (typeof log.oneRM === "number" && log.oneRM > byExercise[name].maxWeight) {
        byExercise[name].maxWeight = log.oneRM;
      }
    });

    return Object.entries(byExercise)
      .map(([exercise, data]) => ({
        exercise,
        bodyPart: data.bodyPart,
        completedSets: data.completedSets,
        completedDays: data.completedDays.size,
        maxWeight: data.maxWeight,
      }))
      .sort((a, b) => b.completedSets - a.completedSets);
  }, [exerciseLogs]);

  const bodyPartSummary = useMemo(() => {
    const map: Record<string, { totalSets: number; completedDays: Set<string>; exercises: Set<string> }> = {};
    exerciseLogs.forEach((log) => {
      const bodyPart = log.bodyPart || "Unknown";
      const date = log.date || "Unknown";
      const exercise = log.exercise || "Unknown Exercise";
      if (!map[bodyPart]) {
        map[bodyPart] = { totalSets: 0, completedDays: new Set(), exercises: new Set() };
      }
      map[bodyPart].totalSets += 1;
      map[bodyPart].completedDays.add(date);
      map[bodyPart].exercises.add(exercise);
    });
    return Object.entries(map)
      .map(([bodyPart, data]) => ({
        bodyPart,
        totalSets: data.totalSets,
        completedDays: data.completedDays.size,
        exercises: Array.from(data.exercises),
      }))
      .sort((a, b) => b.totalSets - a.totalSets);
  }, [exerciseLogs]);

  const downloadExerciseHistory = () => {
    const payload = {
      generatedOn: new Date().toISOString(),
      userEmail,
      activePlan,
      exerciseLogs,
      summary: {
        totalExercises: exerciseSummary.length,
        totalSetsLogged: exerciseLogs.length,
        byExercise: exerciseSummary,
        byBodyPart: bodyPartSummary,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Exercise_History_${activePlan || "plan"}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6 pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-blue-500">
              <ListChecks size={18} /> Exercise History
            </p>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-3">All Completed Exercises</h1>
            <p className="text-gray-500 mt-2 max-w-2xl">
              Review every logged exercise grouped by exercise and body part. Download your workout history along with counts, body parts, and completed days.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/daily-routine"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft size={16} /> Back to Daily Routine
            </Link>
            <button
              onClick={downloadExerciseHistory}
              disabled={exerciseLogs.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-200"
            >
              <Download size={16} /> Download Exercise History
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Summary</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Total Exercises</p>
                <p className="mt-2 text-3xl font-extrabold text-gray-900">{exerciseSummary.length}</p>
              </div>
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Total Sets Logged</p>
                <p className="mt-2 text-3xl font-extrabold text-gray-900">{exerciseLogs.length}</p>
              </div>
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Logged Workout Days</p>
                <p className="mt-2 text-3xl font-extrabold text-gray-900">{Array.from(new Set(exerciseLogs.map(log => log.date))).length}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <section className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Exercise Breakdown</h2>
              {exerciseSummary.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No exercise history found yet. Log some workouts from the Daily Routine screen.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {exerciseSummary.map((item) => (
                    <div key={item.exercise} className="grid gap-3 sm:grid-cols-2 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{item.exercise}</p>
                        <p className="text-xs text-gray-500 mt-1">Body part: {item.bodyPart}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-3xl bg-white p-3 text-center border border-gray-100">
                          <p className="text-2xl font-extrabold text-gray-900">{item.completedSets}</p>
                          <p className="text-xs uppercase text-gray-500">Sets</p>
                        </div>
                        <div className="rounded-3xl bg-white p-3 text-center border border-gray-100">
                          <p className="text-2xl font-extrabold text-gray-900">{item.completedDays}</p>
                          <p className="text-xs uppercase text-gray-500">Days</p>
                        </div>
                        <div className="rounded-3xl bg-white p-3 text-center border border-gray-100">
                          <p className="text-2xl font-extrabold text-gray-900">{item.maxWeight || "--"}</p>
                          <p className="text-xs uppercase text-gray-500">Max weight</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Body Part Summary</h2>
              {bodyPartSummary.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No body part exercise summary available.</p>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {bodyPartSummary.map((item) => (
                    <div key={item.bodyPart} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-700">{item.bodyPart}</p>
                      <p className="text-3xl font-extrabold text-gray-900 mt-3">{item.totalSets}</p>
                      <p className="text-xs text-gray-500 mt-1">Sets logged</p>
                      <p className="text-sm text-gray-600 mt-3">{item.completedDays} workout days</p>
                      <p className="text-xs text-gray-500 mt-1">Exercises: {item.exercises.join(", ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
