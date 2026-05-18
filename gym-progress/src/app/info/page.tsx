"use client";

import React, { useState, useEffect } from "react";
import { Scale, Ruler, Activity, Trash2, Save, User, Clock, Flame } from "lucide-react";

export default function YourMetrics() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [bmi, setBmi] = useState("0.0");
  const [bmiStatus, setBmiStatus] = useState("Unknown");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    if (email) {
      const metrics = JSON.parse(localStorage.getItem(`${email}_metrics`) || "{}");
      setWeight(metrics.weight || localStorage.getItem("userWeight") || "");
      setHeight(metrics.height || localStorage.getItem("userHeight") || "");
      setAge(metrics.age || "");
      setGender(metrics.gender || "Male");
      setActivityLevel(metrics.activityLevel || "Moderate");
      
      if (metrics.weight && metrics.height) {
        calculateBmi(metrics.weight, metrics.height);
      } else if (localStorage.getItem("userWeight") && localStorage.getItem("userHeight")) {
        calculateBmi(localStorage.getItem("userWeight")!, localStorage.getItem("userHeight")!);
      }
    }
  }, []);

  const calculateBmi = (w: string, h: string) => {
    const weightNum = parseFloat(w);
    const heightNum = parseFloat(h) / 100;
    if (weightNum && heightNum) {
      const bmiVal = (weightNum / (heightNum * heightNum)).toFixed(1);
      setBmi(bmiVal);
      const val = parseFloat(bmiVal);
      if (val < 18.5) setBmiStatus("Underweight");
      else if (val < 25) setBmiStatus("Healthy");
      else if (val < 30) setBmiStatus("Overweight");
      else setBmiStatus("Obese");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    const metrics = {
      weight,
      height,
      age,
      gender,
      activityLevel
    };

    localStorage.setItem(`${userEmail}_metrics`, JSON.stringify(metrics));
    // Also save to global keys for backward compatibility/simplicity in plan page
    localStorage.setItem("userWeight", weight);
    localStorage.setItem("userHeight", height);
    
    calculateBmi(weight, height);
    alert("Metrics saved successfully!");
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <header className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-500">Your Metrics</h1>
        <p className="text-gray-500 mt-1">Manage your body measurements and personal details.</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
            <Scale size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Current Weight</span>
            <p className="text-xl font-bold text-gray-900">{weight || "--"} kg</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
            <Ruler size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Height</span>
            <p className="text-xl font-bold text-gray-900">{height || "--"} cm</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Calculated BMI</span>
            <p className="text-xl font-bold text-gray-900">{bmi}</p>
            <span className={`text-xs font-medium ${bmiStatus === 'Healthy' ? 'text-green-500' : 'text-blue-500'}`}>{bmiStatus}</span>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Metrics</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input 
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input 
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 175"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input 
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
            <select 
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Sedentary">Sedentary (Little or no exercise)</option>
              <option value="Light">Light (1-3 days/week)</option>
              <option value="Moderate">Moderate (3-5 days/week)</option>
              <option value="Active">Active (6-7 days/week)</option>
              <option value="Very Active">Very Active (Athlete)</option>
            </select>
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save size={18} /> Save Metrics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
