'use client';

import React, { useState, useEffect } from 'react';
import { Download, Code2, Server, Database, Layers } from 'lucide-react';
import { subscribeToProfile, getCachedProfile, INITIAL_PROFILE } from '../lib/firestore';

function getCategoryIcon(title = '') {
  const t = title.toLowerCase();
  if (t.includes('front') || t.includes('web') || t.includes('ui')) return Code2;
  if (t.includes('back') || t.includes('api') || t.includes('server')) return Server;
  if (t.includes('data') || t.includes('sql')) return Database;
  return Layers;
}

export default function About() {
  const [profile, setProfile] = useState(getCachedProfile);

  useEffect(() => {
    const unsub = subscribeToProfile((data) => {
      if (data) setProfile(data);
    });
    return () => unsub();
  }, []);

  const skillCategories = Array.isArray(profile.skillStacks) && profile.skillStacks.length > 0
    ? profile.skillStacks
    : INITIAL_PROFILE.skillStacks;

  const cvDownloadUrl = profile.cvUrl || '/assets/cv/Jahan_Jayalath-CV.pdf';
  const cvDownloadName = profile.cvFileName || 'Jahan_Jayalath_CV.pdf';

  return (
    <section id="about" className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-[#0c121e]/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            About <span className="text-[#6e57e0] dark:text-[#12f7ff]">Me</span>
          </h2>
          <div className="w-16 h-1 bg-[#6e57e0] dark:bg-[#12f7ff] rounded-full mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Intro Card */}
          <div className="lg:col-span-6 bg-white dark:bg-[#161f30] rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 relative">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {profile.title || 'My introduction'}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg mb-8 whitespace-pre-line">
              {profile.bio || INITIAL_PROFILE.bio}
            </p>

            <a
              href={cvDownloadUrl}
              download={cvDownloadName}
              target={cvDownloadUrl.startsWith('http') ? '_blank' : undefined}
              rel={cvDownloadUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#6e57e0] hover:bg-[#285bd4] transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5"
            >
              <span>Download CV</span>
              <Download className="w-4 h-4" />
            </a>
          </div>

          {/* Right Column: Skill Stacks */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {skillCategories.map((cat, idx) => {
              const Icon = getCategoryIcon(cat.title);
              return (
                <div
                  key={cat.title || idx}
                  className="bg-white dark:bg-[#161f30] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md shadow-slate-200/40 dark:shadow-black/20 hover:border-[#6e57e0]/50 dark:hover:border-[#12f7ff]/40 transition duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#6e57e0]/10 text-[#6e57e0] dark:bg-[#12f7ff]/10 dark:text-[#12f7ff]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {cat.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {cat.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#6e57e0]/10 dark:bg-[#6e57e0]/20 text-[#6e57e0] dark:text-[#c4b5fd] border border-[#6e57e0]/20 dark:border-[#6e57e0]/30 hover:bg-[#6e57e0] hover:text-white dark:hover:bg-[#12f7ff] dark:hover:text-slate-900 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
