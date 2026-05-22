"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type UserStatus = {
  status: "active" | "locked";
  validUntil?: string;
  role?: string;
  message?: string;
};

export default function AccountLockGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [lockedInfo, setLockedInfo] = useState<UserStatus | null>(null);

  useEffect(() => {
    const isAuthPage = pathname === "/login";
    if (isAuthPage) {
      Promise.resolve().then(() => {
        setLockedInfo(null);
      });
      return;
    }

    let isMounted = true;

    const updateStatus = async () => {
      try {
        const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
        if (!isMounted) return;

        // Handle 404 - user not found/deleted
        if (res.status === 404) {
          localStorage.clear();
          router.push('/login?reason=deleted');
          return;
        }

        if (!res.ok) {
          setLockedInfo(null);
          return;
        }

        const data = await res.json();
        if (!data.user) {
          setLockedInfo(null);
          return;
        }

        const { status, validUntil, role, message } = data.user as UserStatus;
        const isLocked = status === "locked";
        const hasExpired = validUntil ? new Date(validUntil).getTime() < Date.now() : false;

        if (role === "client" && (isLocked || hasExpired)) {
          setLockedInfo({
            status: "locked",
            validUntil,
            role,
            message: message || (hasExpired ? "Your access has expired. Contact admin to renew." : "Your account has been locked. Contact admin to unlock it."),
          });
          return;
        }

        setLockedInfo(null);
      } catch {
        setLockedInfo(null);
      }
    };

    updateStatus();
    const interval = window.setInterval(updateStatus, 60_000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [pathname]);

  return (
    <div className="relative min-h-screen">
      {children}
      {lockedInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm px-4 py-10">
          <div className="max-w-xl rounded-3xl border border-red-200 bg-white shadow-2xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 11v2" />
                <path d="M12 17h.01" />
                <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Account Locked</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {lockedInfo.message || "Your account is currently locked. Please contact your administrator for access."}
            </p>
            {lockedInfo.validUntil && (
              <p className="mt-4 text-sm text-gray-500">
                Valid until: {new Date(lockedInfo.validUntil).toLocaleDateString()}
              </p>
            )}
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-red-500">Contact admin to restore access</p>
          </div>
        </div>
      )}
    </div>
  );
}
