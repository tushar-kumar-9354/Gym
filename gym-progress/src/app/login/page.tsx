"use client";

import React, { useState } from "react";
import { Activity, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Email/Name, 2: OTP
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.devOtp) {
          setDevOtp(data.devOtp);
          alert(`[DEV] OTP is ${data.devOtp}`);
        } else {
          alert(`OTP sent to ${email}`);
        }
        setStep(2);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, otp }),
      });
      const data = await res.json();
      
      if (data.success) {
        // Save user info to localStorage
        localStorage.setItem("userName", name);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("isLoggedIn", "true");
        
        window.location.href = "/";
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
    } finally {
      setLoading(false);
    }
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
          /* Step 1: Name & Email */
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">We have sent an OTP to <span className="font-medium text-gray-900">{email}</span></p>
                {devOtp && <p className="text-xs text-blue-500 mt-1">Dev OTP: {devOtp}</p>}
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
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-blue-500 transition-colors text-center"
            >
              Change Email
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          To send real emails, add <code className="bg-gray-100 px-1 rounded">RESEND_API_KEY</code> to .env.local.
        </div>
      </div>
    </div>
  );
}
