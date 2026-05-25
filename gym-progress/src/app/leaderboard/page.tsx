"use client";

import React, { useEffect, useState } from "react";
import usersData from "../../../data/serverUsers.json";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compute = () => {
      try {
        const results = (usersData || []).map((u: any) => {
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

          let allReports: any[] = [];

          // load per-plan daily reports
          planNames.forEach((plan) => {
            try {
              const rpt = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || "[]");
              if (Array.isArray(rpt)) allReports = allReports.concat(rpt);
            } catch {}
          });

          // fallback to global user daily reports
          try {
            const fallback = JSON.parse(localStorage.getItem(`${email}_dailyReports`) || "[]");
            if (Array.isArray(fallback)) allReports = allReports.concat(fallback);
          } catch {}

          // dedupe by date
          const byDate: Record<string, any> = {};
          allReports.forEach((r: any) => { if (r && r.date) byDate[r.date] = r; });
          const uniqueReports = Object.values(byDate);

          const days = uniqueReports.length;
          const avgScore = days > 0 ? Math.round(uniqueReports.reduce((acc: number, d: any) => acc + (Number(d.score) || 0), 0) / days) : 0;

          return {
            name: u.name || u.email,
            email: u.email,
            avgScore,
            daysTracked: days,
            status: u.status || "",
          };
        });

        results.sort((a, b) => b.avgScore - a.avgScore);
        setRows(results);
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
                  <th className="pb-3">Average Score</th>
                  <th className="pb-3">Days Tracked</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.email} className="border-t border-gray-100">
                    <td className="py-3 font-bold w-12">#{i + 1}</td>
                    <td className="py-3">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-gray-400">{r.email}</div>
                    </td>
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
