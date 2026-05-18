"use client";

import React, { useState, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, Calendar, BarChart2, CheckCircle2, FileJson, Trophy } from "lucide-react";

export default function ReportsExport() {
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);

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
    }
  }, []);

  // Calculate Personal Bests
  const personalBests: { [key: string]: number } = {};
  exerciseLogs.forEach(log => {
    if (!personalBests[log.exercise] || log.weight > personalBests[log.exercise]) {
      personalBests[log.exercise] = log.weight;
    }
  });

  const generateAITextReport = () => {
    let report = `GYMPROGRESS+ FITNESS REPORT FOR AI ANALYSIS\n`;
    report += `==================================================\n`;
    report += `User Email: ${userEmail}\n`;
    report += `Active Plan: ${activePlan || "N/A"}\n`;
    report += `Generated On: ${new Date().toLocaleString()}\n`;
    report += `Total Days Finalized: ${dailyReports.length}\n`;
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
          </section>

          {/* Personal Bests Card */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-500">
              <Trophy size={20} /> Personal Bests
            </h2>
            
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {Object.keys(personalBests).length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No records yet.</p>
              ) : (
                Object.entries(personalBests).map(([ex, weight]) => (
                  <div key={ex} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{ex}</span>
                    <span className="font-bold text-gray-900">{weight} kg</span>
                  </div>
                ))
              )}
            </div>
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
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {dailyReports.map((day, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-900">{day.date}</span>
                      <span className="bg-blue-50 text-blue-500 px-2 py-1 rounded text-xs font-bold">Score: {day.score}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>🍴 {day.calories} kcal</div>
                      <div>💧 {day.water}ml</div>
                      <div>🏋️‍♂️ {day.exercises?.length || 0} exercises</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}
