"use client";

import React, { useState, useEffect } from "react";
import { Plus, Target, Calendar, Trash2, Edit2, Check } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

export default function Plans() {
  const [showForm, setShowForm] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [duration, setDuration] = useState("3");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [sleepTarget, setSleepTarget] = useState("8");
  const [goal, setGoal] = useState("General Fitness");

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

  const handleCreateOrUpdatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    const planData = {
      name,
      weight: parseFloat(weight),
      height: parseFloat(height),
      goalWeight: parseFloat(goalWeight),
      duration: parseInt(duration),
      activityLevel,
      sleepTarget: parseInt(sleepTarget),
      goal,
      date: editingPlan ? editingPlan.date : new Date().toISOString(),
    };

    let updatedPlans = [];
    if (editingPlan) {
      // Update existing
      updatedPlans = savedPlans.map(p => p.name === editingPlan.name ? planData : p);
      alert("Plan updated successfully!");
    } else {
      // Create new
      if (savedPlans.some(p => p.name === name)) {
        alert("A plan with this name already exists!");
        return;
      }
      updatedPlans = [...savedPlans, planData];
      alert("Plan created and activated!");
    }

    localStorage.setItem(`${userEmail}_plans`, JSON.stringify(updatedPlans));
    
    if (!editingPlan || activePlan === editingPlan.name) {
      localStorage.setItem(`${userEmail}_activePlan`, name); // Set as active
      setActivePlan(name);
    }

    window.dispatchEvent(new CustomEvent("gym-plan-updated"));
    
    setSavedPlans(updatedPlans);
    setShowForm(false);
    setEditingPlan(null);
    
    // Clear form
    setName("");
    setGoalWeight("");
    setDuration("3");
  };

  const handleEditClick = (plan: any) => {
    setEditingPlan(plan);
    setName(plan.name);
    setWeight(plan.weight.toString());
    setHeight(plan.height.toString());
    setGoalWeight(plan.goalWeight.toString());
    setDuration(plan.duration.toString());
    setActivityLevel(plan.activityLevel || "moderate");
    setSleepTarget((plan.sleepTarget || 8).toString());
    setGoal(plan.goal || "General Fitness");
    setShowForm(true);
  };

  const executeDeletePlan = (planName: string) => {
    const updatedPlans = savedPlans.filter(p => p.name !== planName);
    localStorage.setItem(`${userEmail}_plans`, JSON.stringify(updatedPlans));
    setSavedPlans(updatedPlans);

    // Clean up associated local storage data for this plan
    localStorage.removeItem(`${userEmail}_${planName}_exerciseLogs`);
    localStorage.removeItem(`${userEmail}_${planName}_loggedMeals`);
    localStorage.removeItem(`${userEmail}_${planName}_weeklyWeights`);
    localStorage.removeItem(`${userEmail}_${planName}_dailyReports`);
    
    // Also try to clean up water intake if possible (it's stored by date, we can remove the root object)
    localStorage.removeItem(`${userEmail}_${planName}_waterIntake`);

    // Clean up daily specific water entries
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${userEmail}_${planName}_water_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    if (activePlan === planName) {
      const nextPlan = updatedPlans.length > 0 ? updatedPlans[0].name : null;
      if (nextPlan) {
        localStorage.setItem(`${userEmail}_activePlan`, nextPlan);
      } else {
        localStorage.removeItem(`${userEmail}_activePlan`);
      }
      setActivePlan(nextPlan);
    }

    setConfirmDeletePlan(null);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen pt-24 w-full">
      <header className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-500 mt-1">Select, create, or customize your fitness plans.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => {
              setEditingPlan(null);
              setName("");
              setGoalWeight("");
              setDuration("3");
              setShowForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Create New Plan
          </button>
        )}
      </header>

      {/* Confirmation Modal */}
      {confirmDeletePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Plan?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete "{confirmDeletePlan}"? All associated data will be lost.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeletePlan(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium cursor-pointer">Cancel</button>
              <button onClick={() => executeDeletePlan(confirmDeletePlan)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium shadow-sm cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        /* Plan Creation/Edit Form */
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 w-full max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-blue-500 mb-6">{editingPlan ? "Customize Plan" : "Start a New Plan"}</h2>
          <form onSubmit={handleCreateOrUpdatePlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Cut, Winter Bulk"
                required
                disabled={editingPlan !== null} // Don't allow changing name if editing (used as ID)
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
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
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
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
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">1 Year</option>
                </select>
              </div>
            </div>

            {/* Goal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value="Fat Loss">Fat Loss</option>
                <option value="Muscle Gain">Muscle Gain / Bulk</option>
                <option value="Maintenance">Maintenance</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Athletic Performance">Athletic Performance</option>
              </select>
            </div>

            {/* Activity Level + Sleep Target */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="sedentary">Sedentary (desk job, no gym)</option>
                  <option value="light">Lightly Active (1–2 days/week)</option>
                  <option value="moderate">Moderately Active (3–5 days/week)</option>
                  <option value="active">Very Active (6–7 days/week)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Target (hours)</label>
                <input
                  type="number"
                  min="5"
                  max="12"
                  value={sleepTarget}
                  onChange={(e) => setSleepTarget(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 7–9 hrs for most goals</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={() => { setShowForm(false); setEditingPlan(null); }}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-2xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                {editingPlan ? <Check size={18} /> : <Plus size={18} />}
                {editingPlan ? "Save Changes" : "Start Plan"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Plans List */
        <div className="w-full grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <h2 className="text-xl font-semibold text-blue-500 mb-4">Your Saved Plans</h2>
            {savedPlans.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No plans created yet.</p>
            ) : (
              <div className="space-y-4">
                {savedPlans.map((plan, index) => (
                  <div key={index} className={`p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${activePlan === plan.name ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-50 hover:bg-gray-100'}`}>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.duration} Months • Target: {plan.goalWeight} kg • Current: {plan.weight} kg</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => handleEditClick(plan)}
                        className="text-sm font-medium px-3 py-2 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 size={14} /> Customize
                      </button>
                      <button 
                        onClick={() => setConfirmDeletePlan(plan.name)}
                        className="text-sm font-medium px-3 py-2 rounded-2xl bg-white border border-gray-200 text-red-500 hover:bg-red-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.setItem(`${userEmail}_activePlan`, plan.name);
                          setActivePlan(plan.name);
                          window.location.href = "/";
                        }}
                        className={`text-sm font-medium px-4 py-2 rounded-2xl transition-colors ${activePlan === plan.name ? 'bg-blue-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
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
