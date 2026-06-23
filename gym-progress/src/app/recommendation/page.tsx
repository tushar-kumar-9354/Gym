"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, Utensils, Zap, Award, RefreshCw, AlertCircle, TrendingUp, Calendar, Check, Info } from "lucide-react";

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

    // Prepare reports and meals
    let reportsToSubmit = dailyReports;
    let mealsToSubmit = loggedMeals;

    if (useMockData || dailyReports.length === 0) {
      // Seed high quality mock data for presentation
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Banner Block */}
        <div className="relative mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 text-white shadow-xl overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15 transform translate-x-12 translate-y-12">
            <Sparkles size={280} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-200">AI Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">AI Recommendations</h1>
              <p className="mt-2 text-indigo-100 max-w-xl text-sm sm:text-base">
                Cross-analyzes your protein, fat, and calorie ratios starting from Day 1 to recommend the absolute best meals, exercise setups, and routines.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              {hasNoData && (
                <button
                  onClick={handleSeedMockToStorage}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-md"
                >
                  Seed Demo Data
                </button>
              )}
              <button
                onClick={() => handleGenerate(false)}
                disabled={loading || (hasNoData && !isUsingMock)}
                className="px-6 py-3.5 rounded-xl text-sm font-bold bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-white/20 disabled:text-indigo-200 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Analyzing Day 1...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate AI Recommendations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner when empty */}
        {hasNoData && !recommendations && !loading && (
          <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-amber-200 dark:border-amber-900/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl text-amber-500 shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">No logs logged yet for active plan</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-lg">
                  To test the recommendations page, you can either click **Seed Demo Data** to write sample logs of deadlifts, squats, soy chunks, and whey into your account, or generate recommendations on simulated preview data directly.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGenerate(true)}
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all text-center"
            >
              Analyze Demo Data Directly
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 flex items-center gap-3">
            <AlertCircle className="text-rose-500" size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Loading placeholder */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm h-64 animate-pulse"></div>
              <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm h-48 animate-pulse"></div>
            </div>
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm h-[400px] animate-pulse"></div>
          </div>
        )}

        {/* Main Content Layout */}
        {recommendations && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left side: Stats & AI recommendations */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Highlight Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* best nutrition day card */}
                <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="absolute right-0 top-0 opacity-5 transform translate-x-2 -translate-y-2">
                    <Utensils size={100} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Best Nutrition Day</span>
                    <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-200">{recommendations.bestNutritionDay.date}</h4>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400">Macros: <span className="font-semibold text-gray-700 dark:text-gray-300">{recommendations.bestNutritionDay.protein} protein</span></p>
                    <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{recommendations.bestNutritionDay.ratio}</p>
                  </div>
                </div>

                {/* best food card */}
                <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="absolute right-0 top-0 opacity-5 transform translate-x-2 -translate-y-2">
                    <Zap size={100} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider block mb-1">Best Food Ratio</span>
                    <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-200 truncate">{recommendations.bestFoodRatio.name}</h4>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400">Calories: <span className="font-semibold text-gray-700 dark:text-gray-300">{recommendations.bestFoodRatio.calories}</span></p>
                    <p className="text-[11px] font-medium text-pink-600 dark:text-pink-400 mt-0.5">{recommendations.bestFoodRatio.ratio}</p>
                  </div>
                </div>

                {/* best exercise day card */}
                <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="absolute right-0 top-0 opacity-5 transform translate-x-2 -translate-y-2">
                    <Trophy size={100} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1">Best Exercise Day</span>
                    <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-200">{recommendations.bestExerciseDay.date}</h4>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400">Overall Score: <span className="font-semibold text-gray-700 dark:text-gray-300">{recommendations.bestExerciseDay.score}</span></p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate mt-0.5">
                      {recommendations.bestExerciseDay.exercises[0] || "No exercises"}
                    </p>
                  </div>
                </div>

              </div>

              {/* Comprehensive AI Recommendations Summary Card */}
              <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 text-indigo-500">
                  <Sparkles size={120} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800/40 pb-3">
                  <Sparkles size={18} className="text-indigo-500 animate-pulse" />
                  <span>AI Comprehensive Analysis & Guideline</span>
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                  {recommendations.aiAnalysis}
                </p>
              </div>

              {/* Best Exercise Exercises List */}
              <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                  <Trophy size={18} className="text-amber-500" />
                  <span>Best Performing Day Exercises</span>
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  These exercises were performed on your highest scoring day. Cross-referencing suggests these suited you best and generated optimal muscle load:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendations.bestExerciseDay.exercises.map((ex, i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-gray-800/20 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{ex}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right side: Food Recommendations & Fixes */}
            <div className="space-y-8">
              
              {/* Food Recommendations to Optimize ratio */}
              <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                    <Utensils size={18} className="text-pink-500" />
                    <span>Target Foods to Optimize Ratio</span>
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Add these high-protein, calorie-efficient foods to your diet to replicate your best Day 1 macro ratios:
                  </p>
                  
                  <div className="space-y-4">
                    {recommendations.recommendedFoods.map((food, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/25 border border-gray-100 dark:border-gray-800/10">
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{food.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 rounded-full shrink-0">
                            {food.macros}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {food.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/20 flex gap-3">
                  <Award className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="text-xs font-bold text-indigo-800 dark:text-indigo-400">Macro Tracking Tip</h5>
                    <p className="text-[10px] text-indigo-600/80 dark:text-indigo-300/80 mt-0.5">
                      Fats have 9 kcal/gram while protein and carbs have 4 kcal/gram. Lowering fat slightly is the easiest way to optimize your calorie-to-protein ratio.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
