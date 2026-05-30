"use client";

import React, { useEffect, useState } from "react";
import usersData from "../../../../data/serverUsers.json";
import { Trophy, Award, Star, Zap, Medal } from "lucide-react";

function formatDateKey(d: string) { return d.split('T')[0]; }

export default function BadgesPage() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [badges, setBadges] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastBadge, setToastBadge] = useState<any>(null);

  useEffect(() => {
    const email = (localStorage.getItem('userEmail') || '').toLowerCase();
    setUserEmail(email);
    if (!email) return;

    // Collect all daily reports across plans for this user
    let plans: any[] = [];
    try { plans = JSON.parse(localStorage.getItem(`${email}_plans`) || '[]'); } catch {}
    const planNames = Array.isArray(plans) ? plans.map(p => (typeof p === 'string' ? p : p?.name)).filter(Boolean) : [];

    let allReports: any[] = [];
    planNames.forEach((plan) => {
      try { const rpt = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || '[]'); if (Array.isArray(rpt)) allReports = allReports.concat(rpt); } catch {}
    });
    try { const fallback = JSON.parse(localStorage.getItem(`${email}_dailyReports`) || '[]'); if (Array.isArray(fallback)) allReports = allReports.concat(fallback); } catch {}

    // dedupe by date
    const byDate: Record<string, any> = {};
    allReports.forEach((r: any) => { if (r && r.date) byDate[formatDateKey(r.date)] = r; });
    const reports = Object.values(byDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Report submission badges
    const totalReports = reports.length;
    const reportBadges = {
      submissionI: totalReports >= 1,
      submissionII: totalReports >= 10,
      submissionIII: totalReports >= 50,
      submissionIV: totalReports >= 100,
    };

    // Streak calculation (consecutive report days where score >= 1)
    let currentStreak = 0;
    let maxStreak = 0;
    let prevDate: Date | null = null;
    reports.forEach((r: any) => {
      const d = new Date(formatDateKey(r.date));
      if (!prevDate) {
        currentStreak = (Number(r.score) || 0) >= 1 ? 1 : 0;
      } else {
        const diff = (d.getTime() - prevDate.getTime()) / (1000*60*60*24);
        if (diff === 1 && (Number(r.score) || 0) >= 1) {
          currentStreak += 1;
        } else if ((Number(r.score) || 0) >= 1) {
          currentStreak = 1;
        } else {
          currentStreak = 0;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      prevDate = d;
    });

    const streakBadges = {
      newbie: totalReports >= 0 && Boolean(localStorage.getItem('isLoggedIn')),
      streak1: maxStreak >= 1,
      streak2: maxStreak >= 10,
      streak3: maxStreak >= 30,
    };

    // Leaderboard-based badges (approximate using current leaderboard state)
    // Top contender: check if user's any plan average is in top 10% among entries for that plan
    // For simplicity, check if any last-10 average across user's plans >= 90th percentile of existing entries computed locally
    const allEntries: number[] = [];
    (usersData || []).forEach((u: any) => {
      const e = (localStorage.getItem(`${(u.email||'').toLowerCase()}_plans`) || '[]');
      try {
        const p = JSON.parse(e);
        const names = Array.isArray(p) ? p.map((x:any)=> typeof x === 'string' ? x : x?.name).filter(Boolean) : [];
        names.forEach((plan) => {
          try {
            const rpt = JSON.parse(localStorage.getItem(`${(u.email||'').toLowerCase()}_${plan}_dailyReports`) || '[]');
            if (Array.isArray(rpt)) {
              const byD: Record<string, any> = {};
              rpt.forEach((r:any)=> { if (r && r.date) byD[formatDateKey(r.date)] = r; });
              const repArr = Object.values(byD).sort((a:any,b:any)=> new Date(a.date).getTime()-new Date(b.date).getTime());
              if (repArr.length >= 10) {
                const last10 = repArr.slice(-10);
                const avg = Math.round(last10.reduce((acc:number,d:any)=> acc + (Number(d.score)||0),0)/10);
                allEntries.push(avg);
              }
            }
          } catch {}
        });
      } catch {}
    });

    const top10pctThreshold = allEntries.length ? allEntries.sort((a,b)=>a-b)[Math.max(0, Math.floor(allEntries.length*0.9)-1)] : 100;
    let isTopContender = false;
    let isPro = false;
    let isConsistencyPro = false;

    // evaluate user's plans against threshold
    planNames.forEach((plan) => {
      try {
        const rpt = JSON.parse(localStorage.getItem(`${email}_${plan}_dailyReports`) || '[]');
        if (Array.isArray(rpt)) {
          const byD: Record<string, any> = {};
          rpt.forEach((r:any)=> { if (r && r.date) byD[formatDateKey(r.date)] = r; });
          const repArr = Object.values(byD).sort((a:any,b:any)=> new Date(a.date).getTime()-new Date(b.date).getTime());
          if (repArr.length >= 10) {
            const last10 = repArr.slice(-10);
            const avg = Math.round(last10.reduce((acc:number,d:any)=> acc + (Number(d.score)||0),0)/10);
            if (avg >= top10pctThreshold) isTopContender = true;
            // 'The Pro': if currently top (approximate by checking if avg equals max of allEntries)
            if (allEntries.length && avg === Math.max(...allEntries)) isPro = true;
          }

          // Consistency Pro: average over last 90 days >= 90
          const last90 = repArr.slice(-90);
          if (last90.length >= 30) {
            const avg90 = Math.round(last90.reduce((acc:number,d:any)=> acc + (Number(d.score)||0),0)/last90.length);
            if (avg90 >= 90) isConsistencyPro = true;
          }
        }
      } catch {}
    });

    const leaderboardBadges = { top10pct: isTopContender, pro: isPro, consistencyPro: isConsistencyPro };

    setBadges({ reportBadges, streakBadges, leaderboardBadges, totalReports, currentStreak, maxStreak });

    // detect newly unlocked badges compared to stored state
    try {
      const idMap: Record<string, any> = {
        submissionI: { title: 'Novice', desc: 'Submit your first report' },
        submissionII: { title: 'Beginner', desc: 'Submit 10 reports' },
        submissionIII: { title: 'Intermediate', desc: 'Submit 50 reports' },
        submissionIV: { title: 'Expert', desc: 'Submit 100 reports' },
        streak1: { title: 'Spark', desc: '1 day streak' },
        streak7: { title: 'Committed', desc: '7 day streak' },
        streak2: { title: 'Flame', desc: '10 day streak' },
        streak3: { title: 'Blaze', desc: '30 day streak' },
        top10pct: { title: 'Top Contender', desc: 'Top 10% performer' },
        pro: { title: 'The Pro', desc: 'Held #1 locally' },
        consistencyPro: { title: 'Consistency Pro', desc: '90%+ across quarter' },
        veteran: { title: 'Veteran', desc: '1000 reports (long haul)' }
      };

      const unlockedNow: string[] = [];
      if (reportBadges.submissionI) unlockedNow.push('submissionI');
      if (reportBadges.submissionII) unlockedNow.push('submissionII');
      if (reportBadges.submissionIII) unlockedNow.push('submissionIII');
      if (reportBadges.submissionIV) unlockedNow.push('submissionIV');
      if (streakBadges.streak1) unlockedNow.push('streak1');
      if ((maxStreak || 0) >= 7) unlockedNow.push('streak7');
      if (streakBadges.streak2) unlockedNow.push('streak2');
      if (streakBadges.streak3) unlockedNow.push('streak3');
      if (leaderboardBadges.top10pct) unlockedNow.push('top10pct');
      if (leaderboardBadges.pro) unlockedNow.push('pro');
      if (leaderboardBadges.consistencyPro) unlockedNow.push('consistencyPro');
      if ((totalReports || 0) >= 1000) unlockedNow.push('veteran');

      const key = `${email}_unlockedBadges`;
      const prev: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      const newly = unlockedNow.filter(id => !prev.includes(id));
      if (newly.length > 0) {
        const nid = newly[0];
        setToastBadge({ id: nid, ...(idMap[nid] || {}) });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5200);
      }
      localStorage.setItem(key, JSON.stringify(unlockedNow));
    } catch (e) {}
  }, []);

  const user = (usersData || []).find((u:any) => (u.email||'').toLowerCase() === (userEmail||'').toLowerCase());

  const allBadgeItems = [
    { id: 'submissionI', title: 'Novice', desc: 'Submit your first report', unlocked: Boolean(badges.reportBadges?.submissionI), type: 'submission', icon: Star, progress: [badges.totalReports||0, 1], tier: 'bronze' },
    { id: 'submissionII', title: 'Beginner', desc: 'Submit 10 reports', unlocked: Boolean(badges.reportBadges?.submissionII), type: 'submission', icon: Medal, progress: [badges.totalReports||0, 10], tier: 'silver' },
    { id: 'submissionIII', title: 'Intermediate', desc: 'Submit 50 reports', unlocked: Boolean(badges.reportBadges?.submissionIII), type: 'submission', icon: Trophy, progress: [badges.totalReports||0, 50], tier: 'gold' },
    { id: 'submissionIV', title: 'Expert', desc: 'Submit 100 reports', unlocked: Boolean(badges.reportBadges?.submissionIV), type: 'submission', icon: Award, progress: [badges.totalReports||0, 100], tier: 'diamond' },
    { id: 'streak1', title: 'Spark', desc: '1 day streak', unlocked: Boolean(badges.streakBadges?.streak1), type: 'streak', icon: Zap, progress: [badges.currentStreak||0, 1], tier: 'bronze' },
    { id: 'streak7', title: 'Committed', desc: '7 day streak', unlocked: (badges.maxStreak||0) >= 7, type: 'streak', icon: Zap, progress: [Math.min(badges.maxStreak||0,7), 7], tier: 'silver' },
    { id: 'streak2', title: 'Flame', desc: '10 day streak', unlocked: Boolean(badges.streakBadges?.streak2), type: 'streak', icon: Zap, progress: [badges.maxStreak||0, 10], tier: 'gold' },
    { id: 'streak3', title: 'Blaze', desc: '30 day streak', unlocked: Boolean(badges.streakBadges?.streak3), type: 'streak', icon: Zap, progress: [badges.maxStreak||0, 30], tier: 'diamond' },
    { id: 'consistencyPro', title: 'Consistency Pro', desc: '90%+ across quarter', unlocked: Boolean(badges.leaderboardBadges?.consistencyPro), type: 'leader', icon: Medal, progress: [0, 1], tier: 'gold' },
    { id: 'top10pct', title: 'Top Contender', desc: 'Top 10% performer', unlocked: Boolean(badges.leaderboardBadges?.top10pct), type: 'leader', icon: Trophy, progress: [0, 1], tier: 'diamond' },
    { id: 'pro', title: 'The Pro', desc: 'Held #1 locally', unlocked: Boolean(badges.leaderboardBadges?.pro), type: 'leader', icon: Star, progress: [0, 1], tier: 'diamond' },
    { id: 'veteran', title: 'Veteran', desc: '1000 reports (long haul)', unlocked: (badges.totalReports||0) >= 1000, type: 'milestone', icon: Award, progress: [badges.totalReports||0, 1000], tier: 'diamond' },
  ];

  const colorFor = (tier: string) => {
    switch (tier) {
      case 'bronze': return { from: 'from-amber-300', to: 'to-amber-500', text: 'text-amber-700' };
      case 'silver': return { from: 'from-slate-200', to: 'to-slate-400', text: 'text-slate-700' };
      case 'gold': return { from: 'from-yellow-300', to: 'to-yellow-500', text: 'text-yellow-700' };
      case 'diamond': return { from: 'from-indigo-300', to: 'to-indigo-600', text: 'text-indigo-700' };
      default: return { from: 'from-gray-200', to: 'to-gray-400', text: 'text-gray-700' };
    }
  };

  const filtered = allBadgeItems.filter(b => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'unlocked') return b.unlocked;
    return !b.unlocked;
  });

  return (
    <div className="p-6 bg-gradient-to-b from-amber-50 to-white min-h-screen pt-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => history.back()} className="p-2 rounded-full bg-white shadow-sm">◀</button>
          <div>
            <h2 className="text-2xl font-semibold">Badges</h2>
            <p className="text-sm text-gray-500">Track your achievements</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-xl font-semibold text-amber-800">
            {user ? (user.name ? user.name.split(' ').map((s:any)=>s[0]).slice(0,2).join('') : user.email[0]) : 'U'}
          </div>
          <div>
            <div className="text-lg font-medium">{user?.name || userEmail || 'You'}</div>
            <div className="text-sm text-gray-400">@{(userEmail||'').split('@')[0]}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 mb-4">
          <div className="flex gap-4">
            <button onClick={() => setSelectedTab('all')} className={`flex-1 py-2 rounded-lg ${selectedTab==='all' ? 'bg-amber-100 text-amber-800' : 'text-gray-500'}`}>All Badges</button>
            <button onClick={() => setSelectedTab('unlocked')} className={`flex-1 py-2 rounded-lg ${selectedTab==='unlocked' ? 'bg-amber-100 text-amber-800' : 'text-gray-500'}`}>Unlocked</button>
            <button onClick={() => setSelectedTab('locked')} className={`flex-1 py-2 rounded-lg ${selectedTab==='locked' ? 'bg-amber-100 text-amber-800' : 'text-gray-500'}`}>Locked</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((b) => {
              const Icon = b.icon;
              const cols = colorFor(b.tier || 'bronze');
              return (
                <button key={b.id} onClick={() => setSelectedBadge(b)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transform transition hover:scale-105 focus:scale-105 ${b.unlocked ? 'shadow-2xl' : 'shadow-sm'}`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${b.unlocked ? `bg-gradient-to-br ${cols.from} ${cols.to} text-white` : 'bg-gray-50' } ring-1 ring-white/30`}>
                    <div className={`${b.unlocked ? 'animate-pulse' : ''}`}>
                      <Icon className={`w-10 h-10 ${b.unlocked ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  <div className="text-sm font-medium">{b.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-4">Unlocked: {allBadgeItems.filter(x=>x.unlocked).length} / {allBadgeItems.length}</div>

        {selectedBadge && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div />
                <button onClick={() => setSelectedBadge(null)} className="text-gray-500">✕</button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full bg-amber-100 flex items-center justify-center text-4xl text-amber-700">
                  {React.createElement(selectedBadge.icon, { className: 'w-12 h-12' })}
                </div>
                <h3 className="text-xl font-semibold">{selectedBadge.title}</h3>
                <p className="text-sm text-gray-500">{selectedBadge.desc}</p>

                <div className="w-full">
                  <div className="text-sm text-amber-700 font-medium text-center">{selectedBadge.unlocked ? 'Badge Unlocked !' : 'Progress'}</div>
                  <div className="mt-2 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${Math.min(100, Math.round((selectedBadge.progress[0] / Math.max(1, selectedBadge.progress[1])) * 100))}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">{selectedBadge.progress[0]}/{selectedBadge.progress[1]}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Toast for unlocks */}
        {showToast && toastBadge && (
          <div className="fixed left-1/2 transform -translate-x-1/2 top-8 z-50">
            <div className="relative w-96 bg-gradient-to-r from-amber-400 to-pink-400 text-white rounded-2xl p-4 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                {/* simple confetti pieces */}
                {[...Array(16)].map((_,i)=> (
                  <span key={i} style={{ left: `${(i*7)%100}%`, top: `${-10 - (i%3)*6}px`, transform: `rotate(${i*30}deg)` }} className={`absolute block w-2 h-4 bg-white/80 rounded-sm animate-confetti`} />
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  🎉
                </div>
                <div>
                  <div className="text-sm opacity-90">Achievement Unlocked</div>
                  <div className="font-semibold text-lg">{toastBadge.title}</div>
                  <div className="text-xs opacity-90">{toastBadge.desc}</div>
                </div>
                <div className="ml-auto">
                  <button onClick={() => setShowToast(false)} className="text-white/90">✕</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <style>{`
          @keyframes confetti-fall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1 } 100% { transform: translateY(160px) rotate(200deg); opacity: 0 } }
          .animate-confetti { animation: confetti-fall 1.6s linear forwards; }
        `}</style>
      </div>
    </div>
  );
}
