"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Sparkles, Send, Trash2, Calendar, Clipboard, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Edit2, FileText, ShieldAlert } from "lucide-react";

interface StructuredNote {
  id: string;
  date: string;
  raw: string;
  structured: string;
}

interface SimpleNote {
  id: string;
  date: string;
  content: string;
}

interface CautionAlert {
  weekday: string;
  score: number;
  date: string;
  isToday: boolean;
  reason: string;
}

export default function FixesPage() {
  const [userEmail, setUserEmail] = useState("");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  
  const [rawNotes, setRawNotes] = useState("");
  const [structuredNotes, setStructuredNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState<StructuredNote[]>([]);
  
  // Simple Notes States
  const [simpleNotes, setSimpleNotes] = useState<SimpleNote[]>([]);
  const [newSimpleNote, setNewSimpleNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "history" | "simple">("write");
  const [selectedNote, setSelectedNote] = useState<StructuredNote | null>(null);
  const [copied, setCopied] = useState(false);

  // Caution Alerts State
  const [cautionAlerts, setCautionAlerts] = useState<CautionAlert[]>([]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const plan = localStorage.getItem(`${email}_activePlan`);
    setActivePlan(plan);

    if (email) {
      const stored = JSON.parse(localStorage.getItem(`${email}_fixesNotes`) || "[]");
      setSavedNotes(stored);

      const storedSimple = JSON.parse(localStorage.getItem(`${email}_simpleNotes`) || "[]");
      setSimpleNotes(storedSimple);

      if (plan) {
        const reports = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || "[]");
        setDailyReports(reports);

        const meals = JSON.parse(localStorage.getItem(`${email}_${plan}_loggedMeals`) || "[]");
        setLoggedMeals(meals);

        const logs = JSON.parse(localStorage.getItem(`${email}_${plan}_exerciseLogs`) || "[]");
        setExerciseLogs(logs);

        // Compute Caution Alerts
        computeCautions(reports);
      }
    }
  }, [activePlan]);

  const computeCautions = (reports: any[]) => {
    if (!reports || reports.length === 0) return;

    const today = new Date();
    const todayWeekday = today.toLocaleDateString("en-US", { weekday: "long" });
    const alertsMap: Record<string, CautionAlert> = {};

    reports.forEach((day: any) => {
      const score = day.score ?? 100;
      if (score < 75) {
        const dateObj = new Date(day.date);
        const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
        const isToday = weekday === todayWeekday;
        
        let reason = "Workout/diet score was low.";
        if (day.protein < 100) reason = "Protein intake was deficient.";
        else if (day.water < 2000) reason = "Hydration was below target.";
        else if (!day.exercises || day.exercises.length === 0) reason = "Workout session was skipped or incomplete.";

        alertsMap[weekday] = {
          weekday,
          score,
          date: day.date,
          isToday,
          reason
        };
      }
    });

    setCautionAlerts(Object.values(alertsMap));
  };

  const handleStructurize = async () => {
    if (!rawNotes.trim()) {
      setError("Please write some notes first before structurizing.");
      return;
    }

    setLoading(true);
    setError(null);
    setStructuredNotes("");

    try {
      const res = await fetch("/api/gemini/analyze-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawNotes,
          dailyReports,
          loggedMeals,
          exerciseLogs
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to structure notes: API returned status ${res.status}`);
      }

      const data = await res.json();
      setStructuredNotes(data.structuredNotes);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred during AI analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = () => {
    if (!rawNotes.trim() || !structuredNotes.trim()) {
      setError("Both layman notes and structured AI notes are required to save.");
      return;
    }

    const newNote: StructuredNote = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      raw: rawNotes,
      structured: structuredNotes
    };

    const updatedNotes = [newNote, ...savedNotes];
    setSavedNotes(updatedNotes);
    
    if (userEmail) {
      localStorage.setItem(`${userEmail}_fixesNotes`, JSON.stringify(updatedNotes));
    }

    setSuccessMsg("Structured Fix saved to history successfully!");
    setRawNotes("");
    setStructuredNotes("");
    
    setTimeout(() => {
      setSuccessMsg("");
    }, 3000);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updated);
    if (userEmail) {
      localStorage.setItem(`${userEmail}_fixesNotes`, JSON.stringify(updated));
    }
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const handleSaveSimpleNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSimpleNote.trim()) return;

    const newNote: SimpleNote = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      content: newSimpleNote
    };

    const updated = [newNote, ...simpleNotes];
    setSimpleNotes(updated);
    if (userEmail) {
      localStorage.setItem(`${userEmail}_simpleNotes`, JSON.stringify(updated));
    }
    setNewSimpleNote("");
    setSuccessMsg("Simple note saved successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteSimpleNote = (id: string) => {
    const updated = simpleNotes.filter(n => n.id !== id);
    setSimpleNotes(updated);
    if (userEmail) {
      localStorage.setItem(`${userEmail}_simpleNotes`, JSON.stringify(updated));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormattedNotes = (markdownText: string) => {
    if (!markdownText) return null;
    
    const lines = markdownText.split("\n");
    return (
      <div className="space-y-4 text-gray-700">
        {lines.map((line, idx) => {
          if (line.startsWith("###")) {
            return (
              <h4 key={idx} className="text-sm font-black text-blue-600 mt-5 first:mt-0 border-b border-gray-100 pb-1 uppercase tracking-wider">
                {line.replace("###", "").trim()}
              </h4>
            );
          } else if (line.trim().startsWith("*")) {
            return (
              <div key={idx} className="flex gap-2.5 items-start pl-1">
                <span className="text-blue-500 font-extrabold mt-1 shrink-0">•</span>
                <span className="text-sm leading-relaxed text-gray-600">
                  {line.replace(/^\s*\*\s*/, "").trim()}
                </span>
              </div>
            );
          } else if (line.trim() === "") {
            return null;
          } else {
            return <p key={idx} className="text-sm leading-relaxed pl-1 text-gray-600">{line}</p>;
          }
        })}
      </div>
    );
  };

  const todayCaution = cautionAlerts.find(a => a.isToday);
  const otherCautions = cautionAlerts.filter(a => !a.isToday);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header with structured design */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span className="bg-blue-500 w-2.5 h-6 rounded-full inline-block"></span>
            FIXES & NOTES
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Input layman notes and let AI generate structured actionable fixes or write simple text logs.
          </p>
        </div>
        
        {/* Flat style premium tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl shadow-xs shrink-0">
          <button
            onClick={() => setActiveTab("write")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "write" 
                ? "bg-white text-blue-600 shadow-xs" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            AI Structurizer
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history" 
                ? "bg-white text-blue-600 shadow-xs" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            AI History
            {savedNotes.length > 0 && (
              <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                {savedNotes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("simple")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "simple" 
                ? "bg-white text-blue-600 shadow-xs" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Simple Notes
            {simpleNotes.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                {simpleNotes.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Warning/Caution Banner */}
      {cautionAlerts.length > 0 && activeTab === "write" && (
        <div className="space-y-4">
          {todayCaution && (
            <div className="bg-amber-500/10 border border-amber-200 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 w-full shadow-xs">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-600 border border-amber-500/20 shrink-0">
                  <ShieldAlert size={28} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Journey Warning: Take Care Today ({todayCaution.weekday})
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    On a past {todayCaution.weekday} ({todayCaution.date}), your performance score was low (<strong>{todayCaution.score}%</strong>). 
                    Reason: <em>{todayCaution.reason}</em>
                  </p>
                  <p className="text-xs font-bold text-amber-700 mt-2">
                    Fix: Plan your nutrition, keep hydration high, and ensure workout compliance to break the cycle!
                  </p>
                </div>
              </div>
            </div>
          )}

          {otherCautions.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">📅 Upcoming Caution Schedule</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {otherCautions.map((caution, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50 flex items-start gap-3">
                    <div className="p-2 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl shrink-0">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{caution.weekday} Caution</h5>
                      <p className="text-[10px] text-gray-400 mt-0.5">Score: {caution.score}% on {caution.date}</p>
                      <p className="text-[10px] text-rose-600 font-bold mt-1">Fix: Take care today more!</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-200 p-4 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-200 p-4 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600" />
          {error}
        </div>
      )}

      {/* Write / AI Structurizer Tab */}
      {activeTab === "write" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col h-full space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Express Yourself</h3>
              <p className="text-xs text-gray-400 mt-1">Write notes in layman's language about your workout, energy, protein, food, or water targets.</p>
            </div>

            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="e.g. today workout was bad. felt very low energy and protein was worst because i only had bread. hydration is also not full filled today. but last tuesday biceps curls felt amazing..."
              className="w-full flex-1 min-h-[220px] p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-blue-500 text-sm text-gray-900 resize-y leading-relaxed placeholder-gray-400"
            />

            <div className="flex gap-2">
              <button
                onClick={handleStructurize}
                disabled={loading || !rawNotes.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    AI Structurize
                  </>
                )}
              </button>
              {rawNotes.trim() && (
                <button
                  onClick={() => setRawNotes("")}
                  className="px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-2xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* AI Structured Results Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col min-h-[350px] justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles size={18} className="text-blue-500" />
                  AI Structured Fixes
                </h3>
                {structuredNotes && (
                  <button
                    onClick={() => copyToClipboard(structuredNotes)}
                    className="text-xs font-semibold px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-600 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Clipboard size={12} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              {!structuredNotes && !loading && (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <Sparkles size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-400">No output generated yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                    Enter notes on the left and click "AI Structurize" to see structured fixes.
                  </p>
                </div>
              )}

              {loading && (
                <div className="space-y-3 animate-pulse p-1">
                  <div className="h-5 bg-gray-100 rounded-md w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded-md w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded-md w-5/6"></div>
                  <div className="h-5 bg-gray-100 rounded-md w-1/4 mt-5"></div>
                  <div className="h-3 bg-gray-100 rounded-md w-2/3"></div>
                </div>
              )}

              {structuredNotes && !loading && (
                <div className="max-h-[380px] overflow-y-auto pr-1">
                  {renderFormattedNotes(structuredNotes)}
                </div>
              )}
            </div>

            {structuredNotes && !loading && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <button
                  onClick={handleSaveNote}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  Save Fix to History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved History Tab */}
      {activeTab === "history" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {savedNotes.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl text-center border border-gray-100">
                <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-xs font-bold text-gray-400">No history logs found</p>
              </div>
            ) : (
              savedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between group ${
                    selectedNote?.id === note.id 
                      ? "bg-blue-50/50 border-blue-200 shadow-xs" 
                      : "bg-white border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[10px] font-black text-gray-400 block mb-0.5">{note.date}</span>
                    <p className="text-xs font-bold text-gray-800 truncate">{note.raw}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-rose-50 p-1.5 rounded-lg text-rose-500 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedNote ? (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col h-full">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Analysis Log Detail</span>
                    <h3 className="text-base font-extrabold text-gray-900 mt-0.5">{selectedNote.date}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedNote.structured)}
                      className="text-xs font-semibold px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-600 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Clipboard size={12} />
                      Copy
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(selectedNote.id, e as any)}
                      className="text-xs font-bold px-2.5 py-1.5 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-100">
                  <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-1">Original Layman Note</span>
                  <p className="text-xs italic text-gray-600 leading-relaxed font-mono">"{selectedNote.raw}"</p>
                </div>

                <div className="max-h-[380px] overflow-y-auto pr-1">
                  {renderFormattedNotes(selectedNote.structured)}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-gray-200 p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[350px]">
                <Wrench className="text-gray-300 mb-2 stroke-1" size={40} />
                <p className="text-sm font-bold text-gray-400">Select a log from the list to view detail</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simple Notes Tab */}
      {activeTab === "simple" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-50 h-fit space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Write Simple Note</h3>
            
            <form onSubmit={handleSaveSimpleNote} className="space-y-4">
              <textarea
                value={newSimpleNote}
                onChange={(e) => setNewSimpleNote(e.target.value)}
                placeholder="Type anything here..."
                required
                className="w-full min-h-[160px] p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-blue-500 text-sm text-gray-900 resize-y leading-relaxed placeholder-gray-400"
              />
              
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={14} />
                Save Note
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-50 min-h-[350px]">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Simple Notes History ({simpleNotes.length})
            </h3>

            {simpleNotes.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                <FileText size={40} className="text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400">No notes written yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {simpleNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50 flex justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-black text-blue-500 flex items-center gap-1">
                        <Calendar size={11} />
                        {note.date}
                      </span>
                      <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed font-mono">{note.content}</p>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteSimpleNote(note.id)}
                      className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors h-fit cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
