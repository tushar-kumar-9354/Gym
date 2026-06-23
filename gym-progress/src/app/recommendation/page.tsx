"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, Utensils, Zap, Award, RefreshCw, AlertCircle, Calendar, Info, Check } from "lucide-react";

interface MacroRatio {
  date: string;
  protein: string;
  fat: string;
  calories: string;
  ratio: string;
}

interface FoodRatio {
  name: string;
  protein: string;
  fat: string;
  calories: string;
  ratio: string;
}

interface RecommendedFood {
  name: string;
  reason: string;
  macros: string;
}

interface ExerciseDay {
  date: string;
  exercises: string[];
  score: string;
}

interface RecommendationsData {
  bestNutritionDay: MacroRatio;
  bestFoodRatio: FoodRatio;
  recommendedFoods: RecommendedFood[];
  bestExerciseDay: ExerciseDay;
  aiAnalysis: string;
  isFallback?: boolean;
}

export default function RecommendationPage() {
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email && plan) {
      const reports = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || "[]");
      setDailyReports(reports);

      const meals = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
      setLoggedMeals(meals);
    }
  }, []);

  const handleGenerate = async (useMockData = false) => {
    setLoading(true);
    setError(null);
    setIsUsingMock(useMockData);

    let reportsToSubmit = dailyReports;
    let mealsToSubmit = loggedMeals;

    if (useMockData || dailyReports.length === 0) {
      reportsToSubmit = [
        {
          date: "Mon, Jun 22",
          score: 95,
          calories: 2100,
          protein: 155,
          fat: 60,
          carbs: 220,
          water: 3500,
          sleepHours: 8,
          sleepQuality: "Excellent",
          exercises: [
            { name: "Incline Dumbbell Press", sets: 4, bestWeight: 32 },
            { name: "Flat Bench Barbell Press", sets: 3, bestWeight: 80 },
            { name: "Cable Chest Fly", sets: 3, bestWeight: 25 },
            { name: "Tricep Overhead Extension", sets: 3, bestWeight: 14 }
          ]
        },
        {
          date: "Wed, Jun 17",
          score: 80,
          calories: 2400,
          protein: 120,
          fat: 85,
          carbs: 270,
          water: 2500,
          sleepHours: 7,
          sleepQuality: "Good",
          exercises: [
            { name: "Barbell Squat", sets: 4, bestWeight: 100 },
            { name: "Romanian Deadlift", sets: 4, bestWeight: 90 },
            { name: "Leg Extension", sets: 3, bestWeight: 60 }
          ]
        },
        {
          date: "Fri, Jun 19",
          score: 92,
          calories: 1950,
          protein: 160,
          fat: 45,
          carbs: 190,
          water: 4000,
          sleepHours: 8.5,
          sleepQuality: "Perfect",
          exercises: [
            { name: "Deadlift", sets: 5, bestWeight: 140 },
            { name: "Lat Pulldown", sets: 4, bestWeight: 75 },
            { name: "Seated Cable Row", sets: 3, bestWeight: 65 },
            { name: "Barbell Bicep Curl", sets: 4, bestWeight: 35 }
          ]
        }
      ];

      mealsToSubmit = [
        { name: "Whey Protein Shake", calories: 140, protein: 26, fat: 1.5, carbs: 3 },
        { name: "Soya Chunks with Rice", calories: 520, protein: 45, fat: 8, carbs: 65 },
        { name: "Boiled Eggs (4 white, 1 whole)", calories: 150, protein: 24, fat: 5, carbs: 1 },
        { name: "Paneer Bhurji", calories: 340, protein: 18, fat: 22, carbs: 6 }
      ];
    }

    try {
      const res = await fetch("/api/gemini/analyze-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyReports: reportsToSubmit,
          loggedMeals: mealsToSubmit,
          activePlanName: activePlan
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      setRecommendations(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred while generating recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedMockToStorage = () => {
    if (!userEmail || !activePlan) {
      alert("Please log in and create an active plan first before seeding.");
      return;
    }

    const mockReports = [
      {
        date: "Day 1 (Mon)",
        score: 95,
        calories: 2100,
        protein: 155,
        fat: 60,
        carbs: 220,
        water: 3500,
        sleepHours: 8,
        sleepQuality: "Excellent",
        exercises: [
          { name: "Incline Dumbbell Press", sets: 4, bestWeight: 32 },
          { name: "Flat Bench Barbell Press", sets: 3, bestWeight: 80 },
          { name: "Cable Chest Fly", sets: 3, bestWeight: 25 }
        ]
      },
      {
        date: "Day 2 (Tue)",
        score: 70,
        calories: 2600,
        protein: 95,
        fat: 110,
        carbs: 290,
        water: 1800,
        sleepHours: 6,
        sleepQuality: "Tired",
        exercises: [
          { name: "Barbell Squat", sets: 4, bestWeight: 90 }
        ]
      },
      {
        date: "Day 3 (Wed)",
        score: 92,
        calories: 1950,
        protein: 160,
        fat: 45,
        carbs: 190,
        water: 4000,
        sleepHours: 8.5,
        sleepQuality: "Perfect",
        exercises: [
          { name: "Deadlift", sets: 5, bestWeight: 140 },
          { name: "Lat Pulldown", sets: 4, bestWeight: 75 },
          { name: "Barbell Bicep Curl", sets: 4, bestWeight: 35 }
        ]
      }
    ];

    const mockMeals = [
      { name: "Whey Protein Shake", calories: 140, protein: 26, fat: 1.5, carbs: 3 },
      { name: "Soya Chunks with Rice", calories: 520, protein: 45, fat: 8, carbs: 65 },
      { name: "Boiled Eggs", calories: 150, protein: 24, fat: 5, carbs: 1 },
      { name: "Fast Food Pizza", calories: 850, protein: 20, fat: 42, carbs: 90 }
    ];

    localStorage.setItem(`${userEmail}_${activePlan}_dailyReports`, JSON.stringify(mockReports));
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(mockMeals));
    
    setDailyReports(mockReports);
    setLoggedMeals(mockMeals);
    
    alert("Mock data successfully seeded to your LocalStorage! Now click 'Generate AI Recommendations'.");
  };

  const hasNoData = dailyReports.length === 0;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Structured Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span className="bg-blue-500 w-2.5 h-6 rounded-full inline-block"></span>
            AI RECOMMENDATIONS
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cross-analyzes your food, macro, and exercise metrics starting from Day 1 to suggest target foods and optimal workout setups.
          </p>
        </div>
        
        <div className="flex gap-2.5 shrink-0">
          {hasNoData && (
            <button
              onClick={handleSeedMockToStorage}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Seed Demo Data
            </button>
          )}
          <button
            onClick={() => handleGenerate(false)}
            disabled={loading || (hasNoData && !isUsingMock)}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={13} />
                Analyzing Day 1...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Generate AI Recommendations
              </>
            )}
          </button>
        </div>
      </header>

      {/* Info Warning when empty */}
      {hasNoData && !recommendations && !loading && (
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3.5 items-start">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-500 border border-blue-100 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-gray-900 text-base">No active plan logs found yet</h4>
              <p className="text-xs text-gray-500 mt-0.5 max-w-lg">
                Click **Seed Demo Data** to populate your account with sample squats, deadlifts, and soy chunks logs, or analyze simulated preview data instantly.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleGenerate(true)}
            className="w-full md:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer text-center"
          >
            Analyze Demo Data Directly
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-200 p-4 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600" />
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-100 rounded-3xl h-36 border border-gray-100"></div>
            <div className="bg-gray-100 rounded-3xl h-56 border border-gray-100"></div>
          </div>
          <div className="bg-gray-100 rounded-3xl h-96 border border-gray-100"></div>
        </div>
      )}

      {/* Main recommendation body */}
      {recommendations && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1 */}
              <div className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                <div className="absolute right-0 top-0 opacity-5 transform translate-x-2 -translate-y-2">
                  <Utensils size={90} className="text-gray-900" />
                </div>
                <div>
                  <span className="bg-blue-50 text-blue-600 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider block mb-2 w-fit">Best Nutrition Day</span>
                  <h4 className="text-sm font-black text-gray-900">{recommendations.bestNutritionDay.date}</h4>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span>Protein: <strong>{recommendations.bestNutritionDay.protein}</strong></span>
                  <span className="block text-[10px] text-blue-500 font-bold mt-0.5">{recommendations.bestNutritionDay.ratio}</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                <div className="absolute right-0 top-0 opacity-5 transform translate-x-2 -translate-y-2">
                  <Zap size={90} className="text-gray-900" />
                </div>
                <div>
                  <span className="bg-emerald-50 text-emerald-600 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider block mb-2 w-fit">Best Food Ratio</span>
                  <h4 className="text-sm font-black text-gray-900 truncate">{recommendations.bestFoodRatio.name}</h4>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span>Calories: <strong>{recommendations.bestFoodRatio.calories}</strong></span>
                  <span className="block text-[10px] text-emerald-500 font-bold mt-0.5">{recommendations.bestFoodRatio.ratio}</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-5 rounded-3xl border border-gray-50 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                <div className="absolute right-0 top-0 opacity-5 transform translate-x-2 -translate-y-2">
                  <Trophy size={90} className="text-gray-900" />
                </div>
                <div>
                  <span className="bg-amber-50 text-amber-600 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider block mb-2 w-fit">Best Exercise Day</span>
                  <h4 className="text-sm font-black text-gray-900">{recommendations.bestExerciseDay.date}</h4>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span>Day Score: <strong>{recommendations.bestExerciseDay.score}</strong></span>
                  <span className="block text-[10px] text-amber-500 font-bold mt-0.5 truncate">
                    {recommendations.bestExerciseDay.exercises[0] || "No exercises"}
                  </span>
                </div>
              </div>

            </div>

            {/* AI Analysis Paragraph Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm relative overflow-hidden">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-3 mb-4">
                <Sparkles size={16} className="text-blue-500" />
                AI Comprehensive Analysis & Training Guidelines
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line font-medium">
                {recommendations.aiAnalysis}
              </p>
            </div>

            {/* Exercises List Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5 mb-4">
                <Trophy size={16} className="text-amber-500" />
                Exercises Performed on Best Day
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Cross-referencing logs suggests these exercise routines and muscle groups suited you best:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.bestExerciseDay.exercises.map((ex, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-xs font-bold text-gray-800">{ex}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Side: Food Target Suggestions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col justify-between min-h-[400px]">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5 mb-4 border-b border-gray-100 pb-3">
                  <Utensils size={16} className="text-emerald-500" />
                  Target Foods to Optimize Ratio
                </h3>
                <p className="text-xs text-gray-400 mb-5">
                  Add these high-protein, low-fat options to align your daily meal splits:
                </p>
                
                <div className="space-y-3.5">
                  {recommendations.recommendedFoods.map((food, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="text-xs font-black text-gray-800">{food.name}</h4>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md shrink-0">
                          {food.macros}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{food.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-3">
                <Award size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-extrabold text-gray-900">Macro Tracking Tip</h5>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                    Fats yield 9 kcal/g, whereas proteins/carbs yield 4 kcal/g. Minimizing oil or cheese helps maintain the best calorie-to-protein ratio.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
