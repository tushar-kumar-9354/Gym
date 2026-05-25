"use client";

import React, { useEffect, useState } from "react";
import { Crown, Trophy, Star } from "lucide-react";
import usersData from "../../../data/serverUsers.json";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compute = () => {
      try {
        const entries: any[] = [];
        (usersData || []).forEach((u: any) => {
          const email = (u.email || "").toLowerCase();

          // try to load plan list (may be array of objects or strings)
          let plansRaw: any[] = [];
          try {
            plansRaw = JSON.parse(localStorage.getItem(`${email}_plans`) || "[]");
          } catch (e) {
            plansRaw = [];
          }

          const planNames: string[] = Array.isArray(plansRaw)
            ? plansRaw.map(p => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
            : [];

          // For each plan, compute average score for that plan only
          planNames.forEach((plan) => {
            try {
              const rpt = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || "[]");
              if (Array.isArray(rpt) && rpt.length > 0) {
                const uniqueByDate: Record<string, any> = {};
                rpt.forEach((r: any) => { if (r && r.date) uniqueByDate[r.date] = r; });
                const reports = Object.values(uniqueByDate);
                const days = reports.length;
                const avgScore = days > 0 ? Math.round(reports.reduce((acc: number, d: any) => acc + (Number(d.score) || 0), 0) / days) : 0;
                entries.push({
                  name: u.name || u.email,
                  email: u.email,
                  plan,
                  avgScore,
                  daysTracked: days,
                  status: u.status || "",
                });
              }
            } catch (e) {}
          });
        });

        // sort by avgScore desc
        entries.sort((a, b) => b.avgScore - a.avgScore);
        setRows(entries);
      } catch (err) {
        console.error("Leaderboard compute error", err);
      } finally {
        setLoading(false);
      }
    };

    compute();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen pt-24">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Community Leaderboard</h1>
        <p className="text-sm text-gray-600">Ranked by average daily routine score (higher is better). Days tracked shows how many days contributed to the average.</p>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading leaderboard…</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Member</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Average Score</th>
                  <th className="pb-3">Days Tracked</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.email} className="border-t border-gray-100">
                    <td className="py-3 font-bold w-12">
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-2 text-yellow-500">
                          <Crown size={18} />
                        </span>
                      ) : i === 1 ? (
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <Trophy size={16} />
                        </span>
                      ) : i === 2 ? (
                        <span className="inline-flex items-center gap-2 text-amber-500">
                          <Star size={16} />
                        </span>
                      ) : (
                        `#${i + 1}`
                      )}
                    </td>
                    <td className="py-3">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-gray-400">{r.email}</div>
                    </td>
                    <td className="py-3 font-medium text-slate-700">{r.plan}</td>
                    <td className="py-3 font-bold text-blue-600 w-40">{r.avgScore}</td>
                    <td className="py-3 w-32">{r.daysTracked}</td>
                    <td className="py-3 text-sm text-gray-600">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
