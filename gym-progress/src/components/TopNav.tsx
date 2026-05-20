"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Utensils, Target, FileBarChart, User, BarChart2, Settings, ChevronDown, Calendar, Menu, X, LogOut } from "lucide-react";

export default function TopNav() {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  };

  if (pathname === "/login") return null;

  const mainNavItems = [
    { name: "Home", href: "/", icon: Activity },
    { name: "Journey", href: "/journey", icon: Calendar },
    { name: "Plans", href: "/plans", icon: Target },
    { name: "Visualise", href: "/visualise", icon: BarChart2 },
  ];

  const dropdownItems = [
    { name: "Your Metrics", href: "/info", icon: User },
    { name: "Food Chart", href: "/food-chart", icon: BarChart2 },
    { name: "Daily Routine", href: "/daily-routine", icon: Calendar },
    { name: "Reports", href: "/reports", icon: FileBarChart },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Dumbbell className="text-blue-500 group-hover:rotate-12 transition-transform duration-300" size={24} />
              <span className="text-xl font-black text-blue-600 tracking-tight flex items-center gap-1.5">
                GymProgress+ <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0">Iron</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-500 border border-blue-100" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-500 border border-transparent"
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-500 transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
                <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition-colors"
                    >
                      <item.icon size={16} className="text-gray-400" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 my-1"></div>
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut size={16} className="text-red-500" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setShowDropdown(false)}
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
                className="hidden md:flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
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
              className="md:hidden text-gray-600 hover:text-blue-500 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute top-16 left-0 right-0 z-40">
          <nav className="p-4 space-y-2">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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
            
            <div className="border-t border-gray-50 my-2 pt-2"></div>
            
            {dropdownItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-500 transition-colors"
              >
                <item.icon size={18} className="text-gray-400" />
                <span>{item.name}</span>
              </Link>
            ))}

            <div className="border-t border-gray-50 my-2 pt-2"></div>
            
            {isLoggedIn ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors text-left cursor-pointer"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <User size={18} />
                <span>Get Started</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
