"use client";

import React, { useState, useEffect } from "react";
import { Plus, Target, Calendar, Trash2 } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

export default function Plans() {
  const [showForm, setShowForm] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [savedPlans, setSavedPlans] = useState<any[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [duration, setDuration] = useState("3");

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);
    
    if (email) {
      const plan = localStorage.getItem(`${email}_activePlan`);
      setActivePlan(plan);
      
      const plans = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
      setSavedPlans(plans);

      // Pre-fill from metrics
      const metrics = JSON.parse(localStorage.getItem(`${email}_metrics`) || "{}");
      setWeight(metrics.weight || localStorage.getItem("userWeight") || "");
      setHeight(metrics.height || localStorage.getItem("userHeight") || "");
    }
  }, []);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    const newPlan = {
      name,
      weight: parseFloat(weight),
      height: parseFloat(height),
      goalWeight: parseFloat(goalWeight),
      duration: parseInt(duration),
      date: new Date().toISOString(),
    };

    const updatedPlans = [...savedPlans, newPlan];
    localStorage.setItem(`${userEmail}_plans`, JSON.stringify(updatedPlans));
    localStorage.setItem(`${userEmail}_activePlan`, name); // Set as active
    
    setSavedPlans(updatedPlans);
    setActivePlan(name);
    setShowForm(false);
    
    alert("Plan created and activated!");
    window.location.href = "/";
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Plans</h1>
          <p className="text-gray-500 mt-1">Select or create a plan to start your journey.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Create New Plan
          </button>
        )}
      </header>

      {showForm ? (
        /* Plan Creation Form */
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-blue-500 mb-6">Start a New Plan</h2>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Cut, Winter Bulk"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight (kg)</label>
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 80"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from Your Metrics</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input 
                  type="number" 
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 180"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from Your Metrics</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Weight (kg)</label>
                <input 
                  type="number" 
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  placeholder="e.g. 75"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">1 Year</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                Start Plan
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Plans List */
        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-blue-500 mb-4">Your Plans</h2>
            {savedPlans.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No plans created yet.</p>
            ) : (
              <div className="space-y-4">
                {savedPlans.map((plan, index) => (
                  <div key={index} className={`p-4 border rounded-lg flex justify-between items-center ${activePlan === plan.name ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.duration} Months • Goal: {plan.goalWeight} kg</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          localStorage.setItem(`${userEmail}_activePlan`, plan.name);
                          setActivePlan(plan.name);
                          window.location.href = "/";
                        }}
                        className={`text-sm font-medium px-3 py-1 rounded-lg ${activePlan === plan.name ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        {activePlan === plan.name ? 'Active' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
