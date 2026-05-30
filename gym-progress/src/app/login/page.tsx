"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Activity, Mail, ArrowRight, User, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const [isSignUp, setIsSignUp] = useState(false); // Mode toggle: false = Login, true = SignUp
  const [showResetBanner, setShowResetBanner] = useState(false);

  // Show banner if redirected after reset or delete
  useEffect(() => {
    if (reason === "reset" || reason === "deleted") {
      setShowResetBanner(true);
    }
  }, [reason]);

  // SignUp State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Username or Email
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // Sign Up: Register & Sync
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) return;

    setLoading(true);
    try {
      const register = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.toLowerCase().trim(),
          password: signUpPassword,
        }),
      });
      const registerData = await register.json();

      if (!registerData.ok) {
        alert(registerData.error || "Unable to register account");
        return;
      }

      localStorage.setItem("userName", signUpName.trim());
      localStorage.setItem("userEmail", signUpEmail.toLowerCase().trim());
      localStorage.setItem("isLoggedIn", "true");
      
      try {
        const syncRes = await fetch(`/api/sync?email=${encodeURIComponent(signUpEmail.toLowerCase().trim())}`);
        const syncData = await syncRes.json();
        if (syncData.ok && syncData.data) {
          for (const [key, value] of Object.entries(syncData.data)) {
            localStorage.setItem(key, value as string);
          }
        }
      } catch (err) {
        console.error("Failed to sync on signup", err);
      }
      
      window.location.href = "/";
    } catch (error) {
      console.error("Error creating account:", error);
      alert("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  // Login: Verify Credentials Directly
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", data.user.role);

      try {
        const syncRes = await fetch(`/api/sync?email=${encodeURIComponent(data.user.email)}`);
        const syncData = await syncRes.json();
        if (syncData.ok && syncData.data) {
          for (const [key, value] of Object.entries(syncData.data)) {
            localStorage.setItem(key, value as string);
          }
        }
      } catch (err) {
        console.error("Failed to sync on login", err);
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred while logging in.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setSignUpName("");
    setSignUpEmail("");
    setSignUpPassword("");
    setLoginIdentifier("");
    setLoginPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg">
        {showResetBanner && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center mb-4">
            User data was wiped or deleted. Please sign in or register again.
          </div>
        )}

        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <Activity className="text-blue-500" size={32} />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-blue-500">GymProgress+</h1>
          <p className="mt-2 text-sm text-gray-500">Track your fitness journey securely and beautifully.</p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => !loading && toggleMode()}
              className={`flex-1 pb-4 text-center font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                !isSignUp
                  ? "border-blue-500 text-blue-600 font-semibold"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              disabled={loading}
            >
              Log In
            </button>
            <button
              onClick={() => !loading && toggleMode()}
              className={`flex-1 pb-4 text-center font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                isSignUp
                  ? "border-blue-500 text-blue-600 font-semibold"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>

          {isSignUp ? (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Username / Full Name</label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? "Creating Account..." : "Create Account"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            /* Log In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Username or Email</label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="John Doe or name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? "Verifying..." : "Log In"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-500">Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
