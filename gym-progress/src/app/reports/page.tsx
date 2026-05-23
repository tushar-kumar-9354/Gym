"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Download, FileText, FileSpreadsheet, Calendar, BarChart2, CheckCircle2, FileJson, Trophy, Zap, Droplet } from "lucide-react";
import { proteinTarget } from "@/lib/protein";

export default function ReportsExport() {
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<any>(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [errorWeekly, setErrorWeekly] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email && plan) {
      const reports = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || "[]");
      setDailyReports(reports);

      const logs = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
      setExerciseLogs(logs);

      const meals = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
      setLoggedMeals(meals);
    }
  }, []);

  // State for personal bests
  const [personalBests, setPersonalBests] = useState<Record<string, number>>({});

  // Compute personal bests from exercise logs
  useEffect(() => {
    const bests: Record<string, number> = {};
    exerciseLogs.forEach((log: any) => {
      const name = log.exercise || log.name || "Unknown Exercise";
      const weight = log.weight ?? log.oneRM ?? 0;
      if (!bests[name] || weight > bests[name]) {
        bests[name] = weight;
      }
    });
    setPersonalBests(bests);
  }, [exerciseLogs]);

// Fetch weekly AI analysis when data is ready
  // Removed automatic weekly AI fetch. The weekly analysis will now be triggered by a button click.


  // Fetch weekly AI analysis on demand
  const fetchWeekly = async () => {
    setLoadingWeekly(true);
    setErrorWeekly(null);
    try {
      const userProfile = JSON.parse(localStorage.getItem(`${userEmail}_userProfile`) || "{}");
      const plans = JSON.parse(localStorage.getItem(`${userEmail}_plans`) || "[]");
      const activePlanObject = plans.find((p: any) => p.name === activePlan) || null;

      const foodCounts: Record<string, { name: string; calories: number; protein: number; count: number }> = {};
      loggedMeals.forEach((meal: any) => {
        const key = meal.name || meal.food || "Unknown";
        const existing = foodCounts[key] || { name: key, calories: meal.calories || 0, protein: meal.protein || 0, count: 0 };
        existing.calories = meal.calories || existing.calories;
        existing.protein = meal.protein || existing.protein;
        existing.count += 1;
        foodCounts[key] = existing;
      });
      const frequentFoods = Object.values(foodCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const computeWaterTarget = (weightKg: number, goal: string, activityLevel: string) => {
        const base = weightKg * 35;
        const gainGoal = /muscle|bulk|gain/i.test(goal);
        const goalBonus = gainGoal ? 500 : 0;
        const multipliers: Record<string, number> = { sedentary: 1.0, light: 1.1, moderate: 1.2, active: 1.3 };
        const multiplier = multipliers[activityLevel?.toLowerCase()] ?? 1.2;
        return Math.round((base + goalBonus) * multiplier);
      };

      const body: any = {
        activePlanName: activePlan,
      };
      if (activePlanObject) {
        if (typeof activePlanObject.weight === 'number') body.startWeight = activePlanObject.weight;
        if (typeof activePlanObject.goalWeight === 'number') body.goalWeight = activePlanObject.goalWeight;
        if (typeof activePlanObject.duration === 'number') body.planDuration = activePlanObject.duration;
        if (typeof activePlanObject.targetCalories === 'number') body.targetCalories = activePlanObject.targetCalories;
        body.targetProtein = proteinTarget(activePlanObject.weight, activePlanObject.goal);
        if (typeof activePlanObject.goalWeight === 'number') body.targetFats = Math.round((activePlanObject.goalWeight * 2.20462) * 0.4 * 10) / 10;
        body.targetHydration = computeWaterTarget(activePlanObject.weight, activePlanObject.goal, activePlanObject.activityLevel);
        body.goal = activePlanObject.goal;
        body.activityLevel = activePlanObject.activityLevel;
      }
      if (dailyReports.length > 0) {
        const last = dailyReports[dailyReports.length - 1];
        if (typeof last.weight === 'number') body.currentWeight = last.weight;
      }
      body.dailyReports = dailyReports;
      body.userProfile = userProfile;
      body.frequentFoods = frequentFoods;
      const res = await fetch("/api/gemini/analyze-weekly-secondary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setWeeklyAnalysis(data);
    } catch (e: any) {
      setErrorWeekly(e.message);
    } finally {
      setLoadingWeekly(false);
    }
  };


  const generateAITextReport = () => {
    const totalDays = dailyReports.length;
    const avgScore = totalDays > 0 ? Math.round(dailyReports.reduce((acc, d) => acc + d.score, 0) / totalDays) : 0;
    const avgSleep = totalDays > 0 ? Math.round(dailyReports.reduce((acc, d) => acc + (d.sleepHours || 0), 0) / totalDays).toString() : "0";
    const avgCalories = totalDays > 0 ? Math.round(dailyReports.reduce((acc, d) => acc + d.calories, 0) / totalDays) : 0;

    let report = `GYMPROGRESS+ PREMIUM HEALTH & FITNESS REPORT\n`;
    report += `==================================================\n`;
    report += `User Email: ${userEmail}\n`;
    report += `Active Plan: ${activePlan || "N/A"}\n`;
    report += `Generated On: ${new Date().toLocaleString()}\n`;
    report += `==================================================\n\n`;

    report += `==================================================\n`;
    report += `DETAILED REPORT SUMMARY\n`;
    report += `==================================================\n`;
    report += `- Total Finalized Days: ${totalDays}\n`;
    report += `- Average Daily Score: ${avgScore}%\n`;
    report += `- Average Sleep Duration: ${avgSleep} hours\n`;
    report += `- Average Calories Consumed: ${avgCalories} kcal\n`;
    report += `==================================================\n\n`;

    report += `==================================================\n`;
    report += `PERSONAL BESTS (Strength Records)\n`;
    report += `==================================================\n`;
    if (Object.keys(personalBests).length > 0) {
      Object.entries(personalBests).forEach(([ex, weight]) => {
        report += `- ${ex}: ${weight} kg\n`;
      });
    } else {
      report += `- No exercise logs found.\n`;
    }
    report += `\n`;

    report += `==================================================\n`;
    report += `DAY-BY-DAY LOGS\n`;
    report += `==================================================\n\n`;

    dailyReports.forEach((day, index) => {
      report += `DAY ${index + 1}: ${day.date}\n`;
      report += `--------------------------------------------------\n`;
      report += `Overall Day Score: ${day.score}%\n`;
      report += `Sleep & Recovery:\n`;
      report += `  - Hours Slept: ${day.sleepHours !== null && day.sleepHours !== undefined ? `${day.sleepHours}h` : "N/A"}\n`;
      report += `  - Sleep Quality: ${day.sleepQuality || "N/A"}\n`;
      report += `Nutrition:\n`;
      report += `  - Calories: ${day.calories} kcal\n`;
      report += `  - Protein: ${day.protein}g\n`;
      report += `  - Fats: ${day.fat}g\n`;
      report += `  - Carbs: ${day.carbs}g\n`;
      report += `Hydration:\n`;
      report += `  - Water Intake: ${day.water}ml\n`;
      report += `Workouts:\n`;
      if (day.exercises && day.exercises.length > 0) {
        day.exercises.forEach((ex: any) => {
          report += `  - ${ex.name}: ${ex.sets} sets (Best Weight: ${ex.bestWeight}kg)\n`;
        });
      } else {
        report += `  - No exercises logged.\n`;
      }
      report += `\n`;
    });

    return report;
  };

  const handleDownloadText = () => {
    const reportText = generateAITextReport();
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fitness_Report_${activePlan}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const reportData = {
      user: userEmail,
      plan: activePlan,
      generatedOn: new Date().toISOString(),
      daysFinalized: dailyReports.length,
      personalBests: personalBests,
      data: dailyReports
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fitness_Report_${activePlan}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <header className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-500">Reports & AI Export</h1>
        <p className="text-gray-500 mt-1">Download your highly detailed data including personal bests and daily logs.</p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Actions */}
        <div className="md:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-500">
              <Download size={20} /> Export for AI
            </h2>
            
            <p className="text-sm text-gray-500 mb-4">
              This report now includes your **Personal Bests** and detailed day-by-day logs. Perfect for AI analysis!
            </p>

            <div className="space-y-3">
              <button 
                onClick={handleDownloadText}
                disabled={dailyReports.length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <FileText size={18} /> Download .TXT Report
              </button>
              
              <button 
                onClick={handleDownloadJSON}
                disabled={dailyReports.length === 0}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-500 py-3 rounded-lg transition-colors font-medium border border-blue-100 flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <FileJson size={18} /> Download .JSON Data
              </button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-500">
              <BarChart2 size={20} /> Quick Stats
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Days Finalized</span>
                <span className="font-bold text-gray-900">{dailyReports.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Active Records</span>
                <span className="font-bold text-blue-500">{Object.keys(personalBests).length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Current Plan</span>
                <span className="font-bold text-blue-500">{activePlan || "None"}</span>
              </div>
            </div>
            {/* Button to generate Weekly AI Report */}
            <div className="mt-4 text-center">
              <button
                onClick={fetchWeekly}
                disabled={loadingWeekly}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={18} /> Generate Weekly AI Report
              </button>
              {errorWeekly ? (
                <p className="mt-3 text-sm text-red-500">Unable to generate AI report: {errorWeekly}</p>
              ) : null}
            </div>
          </section>

          
          {/* Personal Bests Card */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-500">
              <Trophy size={20} /> Personal Bests
            </h2>

            {/* Exercise Records */}
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {Object.keys(personalBests).length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No exercise records yet.</p>
              ) : (
                Object.entries(personalBests).map(([ex, weight]) => (
                  <div key={ex} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{ex}</span>
                    <span className="font-bold text-gray-900">{weight} kg</span>
                  </div>
                ))
              )}
            </div>

            {/* Nutrition Records */}
            {dailyReports.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-gray-100 mt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nutrition Records</h3>

                {/* Best Protein Day */}
                <div className="flex justify-between items-center text-sm bg-green-50 p-2.5 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-1 rounded text-green-600">
                      <Trophy size={12} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Best Protein</span>
                  </div>
                  <span className="font-bold text-green-700 text-xs">
                    {(() => {
                      const bestProtein = dailyReports.reduce((max, d) => d.protein > max.protein ? d : max, dailyReports[0]);
                      return `${bestProtein.protein}g on ${new Date(bestProtein.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    })()}
                  </span>
                </div>

                {/* Best Calories Day */}
                <div className="flex justify-between items-center text-sm bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-1 rounded text-orange-600">
                      <FileText size={12} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Best Calories</span>
                  </div>
                  <span className="font-bold text-orange-700 text-xs">
                    {(() => {
                      const bestCals = dailyReports.reduce((max, d) => d.calories > max.calories ? d : max, dailyReports[0]);
                      return `${bestCals.calories} kcal on ${new Date(bestCals.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    })()}
                  </span>
                </div>

                {/* Best Hydration Day */}
                <div className="flex justify-between items-center text-sm bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-1 rounded text-blue-600">
                      <Droplet size={12} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Best Hydration</span>
                  </div>
                  <span className="font-bold text-blue-700 text-xs">
                    {(() => {
                      const bestHydration = dailyReports.reduce((max, d) => d.water > max.water ? d : max, dailyReports[0]);
                      return `${bestHydration.water}ml on ${new Date(bestHydration.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    })()}
                  </span>
                </div>

                {/* Best Score Day */}
                <div className="flex justify-between items-center text-sm bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-1 rounded text-purple-600">
                      <BarChart2 size={12} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">Best Score</span>
                  </div>
                  <span className="font-bold text-purple-700 text-xs">
                    {(() => {
                      const bestScore = dailyReports.reduce((max, d) => d.score > max.score ? d : max, dailyReports[0]);
                      return `${bestScore.score}% on ${new Date(bestScore.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Preview of Saved Days */}
        <div className="md:col-span-2">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-500">
              <Calendar size={20} /> Saved Daily Summaries
            </h2>
            
            {dailyReports.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No days have been finalized yet.</p>
                <p className="text-sm">Go to the Journey page and click "I have done my today's" to save a day!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-150 overflow-y-auto pr-2">
                {dailyReports.map((day, index) => (
                  <Link
                    key={index}
                    href={`/reports/${index}`}
                    className="block border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-900">{day.date}</span>
                      <span className="bg-blue-50 text-blue-500 px-2 py-1 rounded text-xs font-bold">Score: {day.score}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                      <div>🍴 {day.calories} kcal</div>
                      <div>💧 {day.water}ml</div>
                      <div>🏋️‍♂️ {day.exercises?.length || 0} exercises</div>
                      <div>😴 {day.sleepHours !== null && day.sleepHours !== undefined ? `${day.sleepHours}h` : "N/A"} sleep</div>
                    </div>
                  </Link>
                ))}
                {weeklyAnalysis && (
                  <section className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-500">
                      <Zap size={20} /> Weekly AI Insight & Recommendation
                    </h2>
                    <div className="space-y-4">
                      <p className="text-gray-800 whitespace-pre-line">{weeklyAnalysis.weeklyReport}</p>
                      <p className="font-medium text-gray-700">Recommendation: {weeklyAnalysis.routineRecommendation}</p>
                      {weeklyAnalysis.newRoutine && (
                        <>
                          <h3 className="font-semibold mt-3">New Optimized Routine Summary</h3>
                          <p className="text-gray-800 whitespace-pre-line">{weeklyAnalysis.newRoutine.summary || "No summary available."}</p>
                          <h4 className="font-semibold mt-2">Tips</h4>
                          <ul className="list-disc list-inside text-gray-700">
                            {(weeklyAnalysis.newRoutine.tips || []).map((tip: string, i: number) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}
