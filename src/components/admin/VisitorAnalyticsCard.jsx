'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Activity, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Compass, 
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { subscribeToRecentVisitors } from '../../lib/firestore';

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'Recently';
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 30) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function VisitorAnalyticsCard({ visitorStats }) {
  const [recentLogs, setRecentLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToRecentVisitors((logs) => {
      setRecentLogs(logs);
      setLoadingLogs(false);
    }, 10);

    return () => unsubscribe();
  }, []);

  const totalViews = visitorStats?.totalViews || 0;
  const uniqueVisitors = visitorStats?.uniqueVisitors || 0;
  const totalSessions = visitorStats?.totalSessions || 0;
  
  // Calculate today's views from dailyViews map
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayViews = visitorStats?.dailyViews?.[todayStr] || 0;

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Live Visitor Traffic & Analytics</h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time count of people who discover and browse your portfolio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Last visited: </span>
          <span className="text-slate-200 font-medium">
            {visitorStats?.lastVisitedAt ? formatTimeAgo(visitorStats.lastVisitedAt) : 'Ready'}
          </span>
        </div>
      </div>

      {/* 4 Traffic Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80 bg-slate-950/40">
        {/* Unique Visitors */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Unique Visitors
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {uniqueVisitors.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-400">People</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Distinct visitors on your portfolio</p>
        </div>

        {/* Total Views */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Page Views
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {totalViews.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-indigo-400">Views</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total page impressions logged</p>
        </div>

        {/* Total Sessions */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Visitor Sessions
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {totalSessions.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-purple-400">Sessions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unique browsing visits recorded</p>
        </div>

        {/* Today's Views */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Views
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {todayViews.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-400">Today</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Visits logged today</p>
        </div>
      </div>

      {/* Recent Visitors Activity Stream */}
      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>Recent Visitors Stream</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-normal">
              {recentLogs.length} recent
            </span>
          </h4>
          <span className="text-[11px] text-slate-500">Live incoming visits</span>
        </div>

        {loadingLogs ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Loading recent visitor stream...
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No recent visitor logs recorded yet. Visit your portfolio home page to test tracking!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-2.5">Visitor</th>
                  <th className="pb-2.5">Device</th>
                  <th className="pb-2.5">Browser</th>
                  <th className="pb-2.5">Source / Referrer</th>
                  <th className="pb-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentLogs.map((log) => {
                  const DeviceIcon = 
                    log.device === 'Mobile' ? Smartphone :
                    log.device === 'Tablet' ? Tablet : Monitor;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="font-mono text-slate-300 text-[11px]">
                            {log.isUnique ? (
                              <span className="text-emerald-400 font-semibold">New Visitor</span>
                            ) : (
                              <span className="text-slate-400">Returning</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <DeviceIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.device || 'Desktop'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300 font-medium">
                        {log.browser || 'Browser'}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400 truncate max-w-[150px]">
                        {log.referrer === 'Direct' ? (
                          <span className="text-slate-500 italic">Direct Visit</span>
                        ) : (
                          <span className="text-indigo-400 font-medium">{log.referrer}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-400 whitespace-nowrap">
                        {formatTimeAgo(log.visitedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
