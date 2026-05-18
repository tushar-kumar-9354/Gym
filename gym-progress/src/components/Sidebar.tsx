"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Utensils, Target, FileBarChart, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  
  if (pathname === "/login") return null;

  const navItems = [
    { name: "Dashboard", href: "/", icon: Activity },
    { name: "Diet Log", href: "/diet", icon: Utensils },
    { name: "Strength Log", href: "/strength", icon: Dumbbell },
    { name: "Goals & Body", href: "/goals", icon: Target },
    { name: "Reports", href: "/reports", icon: FileBarChart },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 glass-panel border-r border-[var(--color-border)] h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
          <Activity className="text-primary-500" />
          GymProgress+
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-primary-500/10 text-primary-400 border border-primary-500/30" 
                  : "text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)] border border-transparent"
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--color-border)]">
        <Link href="/login" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-danger hover:bg-danger/10 transition-all duration-300">
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </Link>
      </div>
    </div>
  );
}
