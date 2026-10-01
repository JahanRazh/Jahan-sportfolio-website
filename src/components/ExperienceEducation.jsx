'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  Calendar,
  MapPin,
  Building2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Award,
  Layers,
} from 'lucide-react';
import {
  subscribeToPublishedExperiences,
  subscribeToPublishedEducation,
  INITIAL_EXPERIENCES,
  INITIAL_EDUCATION,
} from '../lib/firestore';

export default function ExperienceEducation() {
  const [experiences, setExperiences] = useState(INITIAL_EXPERIENCES);
  const [education, setEducation] = useState(INITIAL_EDUCATION);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'experience' | 'education'

  useEffect(() => {
    const unsubExp = subscribeToPublishedExperiences((items) => {
      setExperiences(items);
      setLoading(false);
    });

    const unsubEdu = subscribeToPublishedEducation((items) => {
      setEducation(items);
      setLoading(false);
    });

    return () => {
      unsubExp();
      unsubEdu();
    };
  }, []);

  const showExp = activeTab === 'all' || activeTab === 'experience';
  const showEdu = activeTab === 'all' || activeTab === 'education';

  return (
    <section id="experience" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10 relative overflow-hidden bg-slate-50/60 dark:bg-slate-900/30 transition-colors duration-300">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/5 dark:bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Career &amp; Academic Journey</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
            Experience &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-purple-400">
              Education
            </span>
          </h2>

          <p className="mt-3 sm:mt-4 text-slate-600 dark:text-slate-400 text-xs sm:text-base leading-relaxed">
            A comprehensive timeline of my professional software engineering experience, corporate projects, and academic background at SLIIT University.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/40'
                  : 'bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 shadow-sm'
              }`}
            >
              <span>All Journey</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-[10px]">
                {experiences.length + education.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'experience'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/25 border border-cyan-500/40'
                  : 'bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 shadow-sm'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work Experience</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-[10px]">
                {experiences.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('education')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'education'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-500/40'
                  : 'bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 shadow-sm'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Education</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-[10px]">
                {education.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className={`grid gap-8 sm:gap-10 ${activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
          
          {/* ─── WORK EXPERIENCE COLUMN ─────────────────────────── */}
          {showExp && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Work Experience</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Engineering roles, internships &amp; professional projects</p>
                </div>
              </div>

              {experiences.length === 0 ? (
                <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
                  No experience entries added yet.
                </div>
              ) : (
                <div className="relative pl-5 sm:pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 sm:space-y-8">
                  {experiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        exp.isCurrent
                          ? 'bg-cyan-500 border-cyan-300 ring-4 ring-cyan-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 group-hover:border-cyan-500 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950'
                      }`} />

                      {/* Experience Card */}
                      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 shadow-md shadow-slate-200/40 dark:shadow-cyan-500/5 transition-all duration-300 hover:-translate-y-0.5">
                        {/* Top Metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {exp.company}
                          </span>

                          <div className="flex items-center gap-2">
                            {exp.employmentType && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {exp.employmentType}
                              </span>
                            )}
                            {exp.isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                                Present
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-200 transition-colors">
                          {exp.title}
                        </h4>

                        {/* Dates & Location */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                          </span>

                          {exp.location && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span>{exp.location}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        {exp.description && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 leading-relaxed mb-4 whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}

                        {/* Tech tags */}
                        {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            {exp.technologies.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── EDUCATION COLUMN ───────────────────────────────── */}
          {showEdu && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Education &amp; Academics</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Degrees, formal qualifications &amp; academic programs</p>
                </div>
              </div>

              {education.length === 0 ? (
                <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
                  No education entries added yet.
                </div>
              ) : (
                <div className="relative pl-5 sm:pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 sm:space-y-8">
                  {education.map((edu, idx) => (
                    <div key={edu.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        edu.isCurrent
                          ? 'bg-purple-500 border-purple-300 ring-4 ring-purple-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 group-hover:border-purple-500 group-hover:bg-purple-50 dark:group-hover:bg-purple-950'
                      }`} />

                      {/* Education Card */}
                      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/40 shadow-md shadow-slate-200/40 dark:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-0.5">
                        {/* Top Metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {edu.institution}
                          </span>

                          <div className="flex items-center gap-2">
                            {edu.grade && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                                {edu.grade}
                              </span>
                            )}
                            {edu.isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
                                Enrolled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Degree */}
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors">
                          {edu.degree}
                        </h4>

                        {/* Dates & Location */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{edu.startDate} – {edu.isCurrent ? 'Present' : edu.endDate}</span>
                          </span>

                          {edu.location && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span>{edu.location}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        {edu.description && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 leading-relaxed mb-4 whitespace-pre-line">
                            {edu.description}
                          </p>
                        )}

                        {/* Key Activities / Modules */}
                        {Array.isArray(edu.activities) && edu.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            {edu.activities.map((act, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {act}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
