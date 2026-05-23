"use client";

import React, { useState, useEffect, Suspense } from "react";
import ProgressBar from "@/components/ProgressBar";
import { Calendar as CalendarIcon, Trash2, Plus, Search, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMacroValue } from "@/utils/oneRM";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function DietContent() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");
  
  const [date, setDate] = useState<string>(urlDate || new Date().toISOString().split('T')[0]);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  
  // Search and Custom Meal States
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  // Custom Meal Form
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const targets = { calories: 2200, protein: 150, fat: 70, carbs: 250 };

  const defaultFoods: FoodItem[] = [
    { name: "Oats (100g)", calories: 389, protein: 17, carbs: 66, fat: 7 },
    { name: "Apple (1 Medium)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: "Banana (1 Medium)", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { name: "Soya Chunks (50g)", calories: 172, protein: 26, carbs: 15, fat: 0.3 },
    { name: "Whey Protein (1 Scoop)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
    { name: "Chapati (1 Piece)", calories: 104, protein: 3, carbs: 22, fat: 0.4 },
    { name: "Milk (250ml)", calories: 150, protein: 8, carbs: 12, fat: 8 },
    { name: "Almonds (10 Pieces)", calories: 70, protein: 2.5, carbs: 2.5, fat: 6 },
    { name: "Protein Shake", calories: 250, protein: 30, carbs: 15, fat: 5 },
  ];

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email && plan) {
      const logged = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
      const todayMeals = logged.filter((m: any) => {
        const mDate = new Date(m.date).toISOString().split('T')[0];
        return mDate === date;
      });
      setLoggedMeals(todayMeals);
    }
    setSearchResults(defaultFoods);
  }, [date]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) {
      setSearchResults(defaultFoods);
      return;
    }

    const filtered = defaultFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
    setSearchResults(filtered);

    setLoading(true);
    try {
      const res = await fetch(`/api/food/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      const apiFoods = (data.foods || []).map((f: any) => ({
        name: f.description,
        calories: getNutrientValue(f, "Energy"),
        protein: getNutrientValue(f, "Protein"),
        carbs: getNutrientValue(f, "Carbohydrate"),
        fat: getNutrientValue(f, "Total lipid"),
      }));
      setSearchResults([...filtered, ...apiFoods]);
    } catch (error) {
      console.error("Error searching food:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNutrientValue = (food: any, name: string) => {
    const nutrient = food.foodNutrients?.find((n: any) => n.nutrientName.toLowerCase().includes(name.toLowerCase()));
    return nutrient ? Math.round(nutrient.value) : 0;
  };

  const handleLogMeal = (food: FoodItem) => {
    if (!userEmail || !activePlan) {
      alert("Please select a plan first!");
      return;
    }
    
    const currentLogged = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const newMeal = { ...food, date: new Date(date).toISOString() };
    const updated = [...currentLogged, newMeal];
    
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updated));
    setLoggedMeals(updated.filter((m: any) => {
      const mDate = new Date(m.date).toISOString().split('T')[0];
      return mDate === date;
    }));
    alert(`${food.name} added to plan "${activePlan}"!`);
  };

  const handleSaveCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !activePlan || !mealName || !calories) return;

    const newMeal = {
      name: mealName,
      calories: parseFloat(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      date: new Date(date).toISOString(),
    };

    const currentLogged = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const updated = [...currentLogged, newMeal];
    
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updated));
    setLoggedMeals(updated.filter((m: any) => {
      const mDate = new Date(m.date).toISOString().split('T')[0];
      return mDate === date;
    }));
    
    setShowCustomForm(false);
    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    alert("Custom meal added!");
  };

  const handleRemoveMeal = (index: number) => {
    if (!userEmail || !activePlan) return;
    
    const allLogged = JSON.parse(localStorage.getItem(`${userEmail}_${activePlan}_loggedMeals`) || "[]");
    const currentMeal = loggedMeals[index];
    
    const updated = allLogged.filter((m: any) => m.date !== currentMeal.date || m.name !== currentMeal.name);
    
    localStorage.setItem(`${userEmail}_${activePlan}_loggedMeals`, JSON.stringify(updated));
    setLoggedMeals(updated.filter((m: any) => {
      const mDate = new Date(m.date).toISOString().split('T')[0];
      return mDate === date;
    }));
  };

  const current = loggedMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    fat: acc.fat + meal.fat,
    carbs: acc.carbs + meal.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Daily Diet Log</h1>
          <p className="text-gray-500 mt-1">Add foods from the chart or create custom meals.</p>
        </div>
        <div className="flex items-center gap-3">
          {activePlan && (
            <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-medium text-blue-500">
              Plan: {activePlan}
            </div>
          )}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <CalendarIcon size={18} className="text-gray-500" />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-gray-900 outline-none text-sm"
            />
          </div>
          <button 
            onClick={() => setShowCustomForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Custom Meal
          </button>
        </div>
      </header>

      {!activePlan ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500">Please select or create a plan first to track your diet.</p>
          <Link href="/plans">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4">Go to Plans</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress & Search */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Summary</h2>
              <div className="space-y-4">
                <ProgressBar label={`Calories (${current.calories} / ${targets.calories})`} progress={(current.calories / targets.calories) * 100} colorClass="bg-blue-500" />
                <ProgressBar label={`Protein (${formatMacroValue(current.protein)}g / ${targets.protein}g)`} progress={(current.protein / targets.protein) * 100} colorClass="bg-blue-400" />
              </div>
            </div>

            {/* Search Food Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Food Chart</h2>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value) setSearchResults(defaultFoods);
                  }} 
                  placeholder="Search food..." 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 text-sm text-gray-900"
                />
                <button type="submit" className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </form>

              <div className="space-y-2 max-h-96 overflow-y-auto text-sm">
                {searchResults.map((food, index) => (
                  <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{food.name}</p>
                      <p className="text-xs text-gray-500">
                        {food.calories} kcal • P: {formatMacroValue(food.protein)}g • F: {formatMacroValue(food.fat)}g • C: {food.carbs}g
                      </p>
                    </div>
                    <button onClick={() => handleLogMeal(food)} className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1">
                      <Plus size={14} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Logged Meals List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Logged Meals for {new Date(date).toLocaleDateString('en-US')}</h2>
            {loggedMeals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No meals logged for this day.</p>
            ) : (
              <div className="space-y-3">
                {loggedMeals.map((meal, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                      <p className="text-xs text-gray-500">
                        {meal.calories} kcal • P: {formatMacroValue(meal.protein)}g • F: {formatMacroValue(meal.fat)}g • C: {meal.carbs}g
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemoveMeal(index)}
                      className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{current.calories} kcal</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietTracker() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DietContent />
    </Suspense>
  );
}
