"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  return (
    <main className={`flex-1 min-h-screen transition-all ${isAuthPage ? 'p-0' : 'pt-16'}`}>
      <div className="w-full">
        {children}
      </div>
    </main>
  );
}
