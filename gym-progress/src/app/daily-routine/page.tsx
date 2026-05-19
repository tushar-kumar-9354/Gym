"use client";

import React, { useState, useEffect } from "react";
import { Calendar, ChevronDown, List, Clock, Activity, Target, Flame } from "lucide-react";
import Link from "next/link";

interface Plan {
  name: string;
  weight: number;
  goalWeight: number;
  duration: number;
  goal: string;
}

export default function DailyRoutine() {
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);
    
    if (email) {
      const planName = localStorage.getItem(`${email}_activePlan`);
      setActivePlan(planName);
      
      const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
      setSavedPlans(plans);
    }
  }, []);

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planName = e.target.value;
    localStorage.setItem(`${userEmail}_activePlan`, planName);
    setActivePlan(planName);
  };

  const currentPlan = savedPlans.find(p => p.name === activePlan);

  // Generate an exact routine based on goal (simplified logic for demonstration)
  const getRoutineForGoal = (goalStr: string = "Fat Loss") => {
    const isMuscle = goalStr.toLowerCase().includes("muscle") || goalStr.toLowerCase().includes("bulk");
    
    if (isMuscle) {
      return [
        { time: "07:00 AM", activity: "Wake up & Hydrate", description: "Drink 500ml water. Optional: Black Coffee." },
        { time: "07:30 AM", activity: "Breakfast (High Carb/Protein)", description: "e.g., Oatmeal, 4 Eggs, Banana." },
        { time: "09:00 AM", activity: "Pre-workout", description: "Complex carbs to fuel the workout." },
        { time: "10:00 AM", activity: "Heavy Resistance Training", description: "Focus on compound movements (Squat, Deadlift, Bench Press). 4 sets of 8-12 reps." },
        { time: "11:30 AM", activity: "Post-workout Meal", description: "Protein Shake & Fast carbs (e.g., White rice & Chicken)." },
        { time: "02:30 PM", activity: "Lunch", description: "Balanced meal with protein, fats, and greens." },
        { time: "06:00 PM", activity: "Dinner", description: "Lean protein, healthy fats, and fiber." },
        { time: "10:00 PM", activity: "Sleep", description: "Aim for 8 hours for maximum recovery." },
      ];
    }
    
    // Default to Fat Loss
    return [
      { time: "06:30 AM", activity: "Wake up & Hydrate", description: "Drink 500ml water." },
      { time: "07:00 AM", activity: "Fasted Cardio", description: "30-45 mins of LISS (Low-Intensity Steady State) cardio." },
      { time: "08:30 AM", activity: "Breakfast (High Protein)", description: "e.g., Egg white omelet with spinach." },
      { time: "01:00 PM", activity: "Lunch", description: "Lean protein (Chicken/Fish) and lots of veggies. Low carb." },
      { time: "04:00 PM", activity: "Resistance Training", description: "Circuit training or high-rep weight lifting to burn calories and maintain muscle." },
      { time: "06:00 PM", activity: "Dinner", description: "Salad with grilled chicken and olive oil." },
      { time: "10:00 PM", activity: "Sleep", description: "Adequate rest to reduce cortisol." },
    ];
  };

  const routine = getRoutineForGoal(currentPlan?.goal || "Fat Loss");

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-500" />
              Daily Routine
            </h1>
            <p className="text-gray-500 mt-1">Your exact daily schedule based on your specific goal.</p>
          </div>
          
          {activePlan && (
            <div className="flex gap-3 items-center">
              <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-blue-100">
                <Target className="text-blue-500" size={20} />
                <span className="font-bold text-blue-500">{activePlan}</span>
              </div>
              
              <div className="relative">
                <select 
                  value={activePlan || ""}
                  onChange={handlePlanChange}
                  className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 text-gray-700 shadow-sm appearance-none pr-10"
                >
                  {savedPlans.map(plan => <option key={plan.name} value={plan.name}>{plan.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          )}
        </header>

        {!activePlan ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-50 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">No Active Plan</h2>
            <p className="text-gray-500 max-w-md mx-auto">Select or create a plan to view your tailored daily routine.</p>
            <Link href="/plans">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors shadow-sm mx-auto">
                Go to Plans
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-500">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recommended Routine</h2>
                <p className="text-sm text-gray-500">Optimized for: <strong className="text-blue-500">{currentPlan?.goal || "Your Goal"}</strong></p>
              </div>
            </div>

            <div className="relative border-l-2 border-blue-100 ml-4 space-y-8 pb-4">
              {routine.map((item, idx) => (
                <div key={idx} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1 bg-white border-4 border-blue-500 w-4 h-4 rounded-full shadow-sm"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                    <span className="text-sm font-bold text-blue-500 flex items-center gap-1">
                      <Clock size={14} /> {item.time}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{item.activity}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
              <Flame className="text-blue-500 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-bold text-gray-900">Consistency is Key</h4>
                <p className="text-sm text-gray-600 mt-1">Stick to this routine for at least 21 days to form a strong habit. Remember, you can adjust the timings based on your work schedule, but try to keep the sequence intact.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
