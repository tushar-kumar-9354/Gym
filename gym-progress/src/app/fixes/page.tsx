"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Sparkles, Send, Trash2, Calendar, Clipboard, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";

interface StructuredNote {
  id: string;
  date: string;
  raw: string;
  structured: string;
}

export default function FixesPage() {
  const [userEmail, setUserEmail] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [structuredNotes, setStructuredNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState<StructuredNote[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "history">("write");
  const [selectedNote, setSelectedNote] = useState<StructuredNote | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    if (email) {
      const stored = JSON.parse(localStorage.getItem(`${email}_fixesNotes`) || "[]");
      setSavedNotes(stored);
    }
  }, []);

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
        body: JSON.stringify({ rawNotes }),
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format structured notes with styles
  const renderFormattedNotes = (markdownText: string) => {
    if (!markdownText) return null;
    
    const lines = markdownText.split("\n");
    return (
      <div className="space-y-4 text-gray-700 dark:text-gray-300">
        {lines.map((line, idx) => {
          if (line.startsWith("###")) {
            // Heading line
            return (
              <h4 key={idx} className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-6 first:mt-0 border-b border-blue-100 dark:border-blue-900/30 pb-1">
                {line.replace("###", "").trim()}
              </h4>
            );
          } else if (line.trim().startsWith("*")) {
            // Asterisk Bullet point line
            return (
              <div key={idx} className="flex gap-3 items-start pl-2">
                <span className="text-blue-500 font-extrabold mt-1 shrink-0">•</span>
                <span className="text-sm sm:text-base leading-relaxed">
                  {line.replace(/^\s*\*\s*/, "").trim()}
                </span>
              </div>
            );
          } else if (line.trim() === "") {
            return null;
          } else {
            // Regular text
            return <p key={idx} className="text-sm leading-relaxed pl-2">{line}</p>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Block */}
        <div className="relative mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
            <Wrench size={300} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                <Wrench size={16} className="text-amber-300" />
                <span className="text-xs font-semibold tracking-wider uppercase text-amber-200">Settings Area</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">FIXES</h1>
              <p className="mt-2 text-blue-100 max-w-xl text-sm sm:text-base">
                Input notes about exercises, hydration, or meals in standard layman's terms. Let AI structure them into actionable plans to improve.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("write")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "write" 
                    ? "bg-white text-blue-600 shadow-md" 
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                New Analysis
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "history" 
                    ? "bg-white text-blue-600 shadow-md" 
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                Saved History
                {savedNotes.length > 0 && (
                  <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {savedNotes.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 flex items-center gap-3">
            <AlertCircle className="text-rose-500" size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Tab 1: Write & Structurize */}
        {activeTab === "write" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Input card */}
            <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span>1. Express Yourself</span>
                </h3>
                <span className="text-xs text-gray-400">Layman's Language</span>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">
                Mention how your workout went, which exercises felt bad, how was food/protein, did you fulfill water target, and which day felt like the absolute best exercise day.
              </p>

              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="e.g. today workout was bad. felt very low energy and protein was worst because i only had bread. hydration is also not full filled today. but last tuesday biceps curls felt amazing and extremely strong, i want to follow that again..."
                className="w-full flex-1 min-h-[250px] p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 resize-y text-gray-700 dark:text-gray-200 text-sm sm:text-base leading-relaxed placeholder-gray-400"
              />

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStructurize}
                  disabled={loading || !rawNotes.trim()}
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-slate-800 disabled:text-gray-400 text-white font-bold transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      AI Analyzing & Structuring...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      AI Structurize
                    </>
                  )}
                </button>
                {rawNotes.trim() && (
                  <button
                    onClick={() => setRawNotes("")}
                    className="px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 font-semibold transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Structured/Output Card */}
            <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm flex flex-col min-h-[350px] justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Sparkles className="text-indigo-500 animate-pulse" size={20} />
                    <span>2. AI Structured Fixes</span>
                  </h3>
                  {structuredNotes && (
                    <button
                      onClick={() => copyToClipboard(structuredNotes)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Clipboard size={12} />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>

                {!structuredNotes && !loading && (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500 mb-3">
                      <Sparkles size={24} />
                    </div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No output generated yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                      Enter notes on the left and click "AI Structurize" to see structured asterisked recommendations.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="space-y-4 animate-pulse p-2">
                    <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-md w-1/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-md w-5/6"></div>
                    <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-md w-1/4 mt-6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-md w-2/3"></div>
                  </div>
                )}

                {structuredNotes && !loading && (
                  <div className="prose dark:prose-invert max-w-none max-h-[480px] overflow-y-auto pr-2">
                    {renderFormattedNotes(structuredNotes)}
                  </div>
                )}
              </div>

              {structuredNotes && !loading && (
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800/40">
                  <button
                    onClick={handleSaveNote}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Save Fix to History
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Saved History */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* History List Side */}
            <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest px-2 mb-2">Saved Logs</h3>
              
              {savedNotes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl text-center border border-gray-100 dark:border-gray-800/40">
                  <Calendar className="mx-auto text-gray-300 dark:text-gray-700 mb-2" size={32} />
                  <p className="text-sm font-semibold text-gray-500">No logs found</p>
                  <p className="text-xs text-gray-400 mt-1">Structure and save your first note to build history.</p>
                </div>
              ) : (
                savedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between group ${
                      selectedNote?.id === note.id 
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 shadow-sm" 
                        : "bg-white dark:bg-slate-900/40 border-gray-100 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={13} className="text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-400">{note.date}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                        {note.raw}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1.5 rounded-lg text-rose-500 transition-all"
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Note Detail Viewer Pane */}
            <div className="lg:col-span-2">
              {selectedNote ? (
                <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/40 pb-4 mb-6">
                    <div>
                      <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Analysis Log Detail</span>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mt-1">
                        <Calendar size={16} className="text-gray-400" />
                        {selectedNote.date}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(selectedNote.structured)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Clipboard size={13} />
                        {copied ? "Copied!" : "Copy structured"}
                      </button>
                      <button
                        onClick={(e) => handleDeleteNote(selectedNote.id, e as any)}
                        className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Raw Layman notes block */}
                  <div className="mb-6 p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">Original Layman Note</h4>
                    <p className="text-sm italic text-gray-600 dark:text-gray-400 leading-relaxed font-mono">
                      "{selectedNote.raw}"
                    </p>
                  </div>

                  {/* Formatted Structured AI Output block */}
                  <div className="prose dark:prose-invert max-w-none max-h-[500px] overflow-y-auto pr-2">
                    {renderFormattedNotes(selectedNote.structured)}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900/40 border border-dashed border-gray-200 dark:border-gray-800/60 p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px]">
                  <Wrench className="text-gray-300 dark:text-gray-700 mb-4 stroke-1" size={48} />
                  <p className="text-gray-500 font-semibold">Select an analysis log from the left sidebar</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[260px]">
                    Select a logged fix to view the detailed structured AI recommendation and replay details.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
