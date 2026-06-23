"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Utensils, Target, Calendar, User, BarChart2, ChevronDown, Menu, X, LogOut, FileBarChart, Trophy, Medal, Wrench } from "lucide-react";

export default function TopNav() {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<"progress" | "routine" | "settings" | "achievements" | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Read login state on client only to avoid SSR/client hydration mismatch
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("isLoggedIn") === "true";
    if (stored) setIsLoggedIn(true);
  }, []);

  const handleLogout = () => {
    (async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (email) {
          const updates: { [k: string]: string } = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const v = localStorage.getItem(key);
              if (v !== null) updates[key] = v;
            }
          }

          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, updates, removals: [] })
          });
        }
      } catch (err) {
        // don't block logout on sync failure
      } finally {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        setIsLoggedIn(false);
        window.location.href = "/login";
      }
    })();
  };

  if (pathname === "/login") return null;

  const progressItems = [
    { name: "Daily Routine", href: "/journey", icon: Calendar },
    { name: "Visualise Analytics", href: "/visualise", icon: BarChart2 },
    { name: "Strength Tracker", href: "/strength", icon: Dumbbell },
  ];

  const achievementsItems = [
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Badges", href: "/achievements/badges", icon: Medal },
  ];

  const routineItems = [
    { name: "Food Chart", href: "/food-chart", icon: Utensils },
    { name: "Time Table", href: "/daily-routine", icon: Calendar },
  ];

  const settingsItems = [
    { name: "Plan Details", href: "/plans", icon: Target },
    { name: "Your Metrics", href: "/info", icon: User },
    { name: "AI Reports", href: "/reports", icon: FileBarChart },
    { name: "FIXES", href: "/fixes", icon: Wrench },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm" ref={dropdownRef}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group mr-6">
              <Dumbbell className="text-blue-500 group-hover:rotate-12 transition-transform duration-300" size={24} />
              <span className="text-xl font-black text-blue-600 tracking-tight flex items-center gap-1.5">
                GymProgress+ <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0">Iron</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 flex-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/" 
                  ? "bg-blue-50 text-blue-500 border border-blue-100" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-500 border border-transparent"
              }`}
            >
              Dashboard
            </Link>

            {/* 1. Progress Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "progress" ? null : "progress")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === "progress" || progressItems.some(i => pathname === i.href)
                    ? "bg-blue-50 text-blue-500" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                }`}
              >
                <span>Progress</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "progress" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "progress" && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-250">
                  {progressItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        pathname === item.href 
                          ? "bg-blue-50 text-blue-500 font-bold" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-blue-500"
                      }`}
                    >
                      <item.icon size={16} className="text-gray-400 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Routine Dropdown */}
            {/* 2. Achievements Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "achievements" ? null : "achievements")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === "achievements" || achievementsItems.some(i => pathname === i.href)
                    ? "bg-blue-50 text-blue-500" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                }`}
              >
                <span>Achievements</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "achievements" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "achievements" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-250">
                  {achievementsItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        pathname === item.href 
                          ? "bg-blue-50 text-blue-500 font-bold" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-blue-500"
                      }`}
                    >
                      <item.icon size={16} className="text-gray-400 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "routine" ? null : "routine")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === "routine" || routineItems.some(i => pathname === i.href)
                    ? "bg-blue-50 text-blue-500" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                }`}
              >
                <span>Routine</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "routine" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "routine" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-250">
                  {routineItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        pathname === item.href 
                          ? "bg-blue-50 text-blue-500 font-bold" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-blue-500"
                      }`}
                    >
                      <item.icon size={16} className="text-gray-400 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "settings" ? null : "settings")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === "settings" || settingsItems.some(i => pathname === i.href)
                    ? "bg-blue-50 text-blue-500" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                }`}
              >
                <span>Settings</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "settings" ? "rotate-180" : ""}`} />
              </button>

              {activeDropdown === "settings" && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-250">
                  {settingsItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        pathname === item.href 
                          ? "bg-blue-50 text-blue-500 font-bold" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-blue-500"
                      }`}
                    >
                      <item.icon size={16} className="text-gray-400 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 my-1"></div>
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer font-medium"
                    >
                      <LogOut size={16} className="text-red-500" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      <span>Login</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            ) : (
              <Link href="/login" className="hidden md:block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                Get Started
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="md:hidden text-gray-600 hover:text-blue-500 focus:outline-none touch-target"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute top-16 left-0 right-0 z-40 max-h-[85vh] overflow-y-auto">
          <nav className="p-4 space-y-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${pathname === "/" ? "bg-blue-50 text-blue-500" : "text-gray-700"}`}
            >
              Dashboard
            </Link>

            {/* Mobile Progress Group */}
            <div>
              <span className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Progress Tracker</span>
              {progressItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-500" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Routine Group */}
            <div>
              <span className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Routine & Diet</span>
              {routineItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-500" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Settings Group */}
            <div>
              <span className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Settings & Profile</span>
              {settingsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-500" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-3">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <User size={18} />
                  <span>Get Started</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
