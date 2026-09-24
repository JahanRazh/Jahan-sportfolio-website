'use client';

import React from 'react';
import { FolderGit2, CheckCircle2, FileEdit, Star } from 'lucide-react';

export default function DashboardStats({ projects = [] }) {
  const total = projects.length;
  const published = projects.filter((p) => p.published).length;
  const drafts = projects.filter((p) => !p.published).length;
  const featured = projects.filter((p) => p.featured).length;

  const stats = [
    {
      label: 'Total Projects',
      value: total,
      icon: FolderGit2,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      label: 'Published Live',
      value: published,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'Drafts / Hidden',
      value: drafts,
      icon: FileEdit,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      label: 'Featured Projects',
      value: featured,
      icon: Star,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg shadow-black/20 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${stat.bgColor}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
