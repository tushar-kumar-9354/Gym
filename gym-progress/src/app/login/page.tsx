"use client";

import React, { useState, useEffect } from "react";
import { Activity, Mail, ArrowRight, ShieldCheck, User, Lock, Sparkles, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface RegisteredUser {
  name: string;
  email: string;
  password?: string;
}

export default function Login() {
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

  //SignUp State
  
  // SignUp State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Info, 2: OTP Verification
  const [signUpMessage, setSignUpMessage] = useState("");

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Username or Email
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // Sign Up: Step 1 - Send OTP
  const handleSignUpSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) return;

    const emailKey = signUpEmail.toLowerCase().trim();
    const nameKey = signUpName.trim();

    if (!nameKey || !emailKey || !signUpPassword) {
      alert("Please complete all fields before requesting the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: emailKey }),
      });
      const data = await res.json();
      
      if (data.success) {
        setSignUpMessage(data.message || "OTP sent successfully.");
        setStep(2);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("An error occurred while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Sign Up: Step 2 - Verify OTP & Save Registration
  const handleSignUpVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !signUpEmail || !signUpPassword || !signUpName) return;

    setLoading(true);
    try {
      const verify = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email: signUpEmail.toLowerCase().trim(), otp }),
      });
      const verifyData = await verify.json();

      if (!verifyData.success) {
        alert(verifyData.error || "Invalid OTP");
        return;
      }

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
      window.location.href = "/";
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("An error occurred during verification.");
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
    setOtp("");
    setStep(1);
    setSignUpMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <Activity className="text-blue-500" size={32} />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-blue-500">GymProgress+</h1>
          <p className="mt-2 text-sm text-gray-500">Track your fitness journey securely and beautifully.</p>
        </div>

        {step === 1 ? (
          /* Step 1: Login / Sign Up Forms */
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
              <form onSubmit={handleSignUpSendOtp} className="space-y-4">
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
                  <label className="text-sm font-medium text-gray-700">Email Address (for Verification OTP)</label>
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
                  <label className="text-sm font-medium text-gray-700">Password (for Future Login)</label>
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
                  {loading ? "Sending..." : "Send OTP"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
        ) : (
          /* Step 2: SignUp OTP Verification */
          <form className="mt-8 space-y-6" onSubmit={handleSignUpVerifyOtp}>
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">{signUpMessage}</p>
                <p className="text-xs text-gray-400 mt-2">
                  For safety, the OTP is not shown on the UI. Check your email inbox.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Enter OTP</label>
                <div className="mt-1 relative">
                  <ShieldCheck className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={4}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-center text-lg font-bold letter-spacing-widest"
                    placeholder="••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify & Create Account"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-blue-500 transition-colors text-center cursor-pointer"
            >
              Go Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
