"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Utensils, Target, LogOut, Calendar, User, BarChart2, FileBarChart, Wrench } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isLoggedIn] = useState(() => typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true");

  if (pathname === "/login") return null;

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  };

  const progressItems = [
    { name: "Journey", href: "/journey", icon: Calendar },
    { name: "Visualise", href: "/visualise", icon: BarChart2 },
    { name: "Strength Tracker", href: "/strength", icon: Dumbbell },
  ];

  const routineItems = [
    { name: "Food Chart", href: "/food-chart", icon: Utensils },
    { name: "Daily Routine", href: "/daily-routine", icon: Calendar },
  ];

  const settingsItems = [
    { name: "Plan Details", href: "/plans", icon: Target },
    { name: "Your Metrics", href: "/info", icon: User },
    { name: "AI Reports", href: "/reports", icon: FileBarChart },
    { name: "FIXES", href: "/fixes", icon: Wrench },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 glass-panel border-r border-[var(--color-border)] h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="text-xl font-black text-gradient flex items-center gap-2 group">
          <Dumbbell className="text-primary-500 group-hover:rotate-12 transition-transform duration-300" size={22} />
          GymProgress+ <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0">Iron</span>
        </Link>
      </div>
      
      <div className="flex-1 px-4 py-2 space-y-6">
        {/* Progress Category */}
        <div>
          <span className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Progress Tracker</span>
          <div className="space-y-1">
            {progressItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-primary-500/10 text-primary-400 border border-primary-500/30" 
                      : "text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)] border border-transparent"
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Routine Category */}
        <div>
          <span className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Routine & Diet</span>
          <div className="space-y-1">
            {routineItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-primary-500/10 text-primary-400 border border-primary-500/30" 
                      : "text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)] border border-transparent"
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Settings Category */}
        <div>
          <span className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Settings & Profile</span>
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-primary-500/10 text-primary-400 border border-primary-500/30" 
                      : "text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)] border border-transparent"
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
            
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:text-danger hover:bg-danger/10 border border-transparent transition-all duration-300 text-left cursor-pointer"
              >
                <LogOut size={18} />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--color-border)] mt-auto shrink-0">
        <Link href="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${pathname === "/" ? "bg-primary-500/10 text-primary-400 border border-primary-500/30" : "text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)] border border-transparent"}`}>
          <Activity size={18} />
          <span className="font-medium text-sm">Main Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
