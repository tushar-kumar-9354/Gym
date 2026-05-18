"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Plus } from "lucide-react";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function FoodChart() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [foods, setFoods] = useState<FoodItem[]>([]);

  // Custom Meal Form
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);
    
    // Initial fetch for a common item to not leave the page empty
    fetchInitialFoods();
  }, []);

  const fetchInitialFoods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/food/search?query=vegetables`);
      const data = await res.json();
      const apiFoods = (data.foods || []).slice(0, 10).map((f: any) => ({
        name: f.description,
        calories: getNutrientValue(f, "Energy"),
        protein: getNutrientValue(f, "Protein"),
        carbs: getNutrientValue(f, "Carbohydrate"),
        fat: getNutrientValue(f, "Total lipid"),
      }));
      setFoods(apiFoods);
    } catch (error) {
      console.error("Error fetching initial foods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

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
      
      setFoods(apiFoods);
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
    const email = localStorage.getItem("userEmail") || "";
    const plan = localStorage.getItem(`${email}_activePlan`);
    
    if (!email || !plan) {
      alert("Please select a plan first!");
      return;
    }
    
    const currentLogged = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
    const updated = [...currentLogged, { ...food, date: new Date().toISOString() }];
    localStorage.setItem(`${email}_${plan}_loggedMeals`, JSON.stringify(updated));
    alert(`${food.name} logged successfully to plan "${plan}"!`);
  };

  const handleSaveCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem("userEmail") || "";
    const plan = localStorage.getItem(`${email}_activePlan`);
    
    if (!email || !plan || !mealName || !calories) {
      alert("Please select a plan first!");
      return;
    }

    const newMeal = {
      name: mealName,
      calories: parseFloat(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    };

    const currentLogged = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
    const updated = [...currentLogged, { ...newMeal, date: new Date().toISOString() }];
    
    localStorage.setItem(`${email}_${plan}_loggedMeals`, JSON.stringify(updated));
    
    setShowCustomForm(false);
    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    alert("Custom meal added and logged!");
  };

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Food Chart</h1>
          <p className="text-gray-500 mt-1">Search food details dynamically using the USDA database.</p>
        </div>
        <button 
          onClick={() => setShowCustomForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Custom Meal
        </button>
      </header>

      {/* Custom Meal Form */}
      {showCustomForm && (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-lg mb-6 max-w-2xl mx-auto border-t-4 border-t-blue-500">
          <h2 className="text-xl font-semibold text-blue-500 mb-4">Add Custom Meal</h2>
          <form onSubmit={handleSaveCustomMeal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
              <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Protein Shake" required className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:border-blue-500 text-gray-900" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" required className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:border-blue-500 text-gray-900" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowCustomForm(false)} className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">Add Meal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search food (e.g. Chicken, Rice, Broccoli)..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors min-w-[100px] flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Search"}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="pb-3 font-medium">Food Item</th>
                <th className="pb-3 font-medium">Calories</th>
                <th className="pb-3 font-medium">Protein</th>
                <th className="pb-3 font-medium">Fat</th>
                <th className="pb-3 font-medium">Carbs</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {foods.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Search for a food item above to see its details.
                  </td>
                </tr>
              ) : (
                foods.map((food, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{food.name}</td>
                    <td className="py-3">{food.calories} kcal</td>
                    <td className="py-3">{food.protein}g</td>
                    <td className="py-3">{food.fat}g</td>
                    <td className="py-3">{food.carbs}g</td>
                    <td className="py-3">
                      <button 
                        onClick={() => handleLogMeal(food)}
                        className="text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
