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
    <section id="experience" className="py-24 px-6 sm:px-10 relative overflow-hidden bg-slate-900/30">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Career &amp; Academic Journey</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Experience &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
              Education
            </span>
          </h2>

          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            A comprehensive timeline of my professional software engineering experience, corporate projects, and academic background at SLIIT University.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/40'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>All Journey</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900/60 text-[10px]">
                {experiences.length + education.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'experience'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/25 border border-cyan-500/40'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work Experience</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900/60 text-[10px]">
                {experiences.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('education')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'education'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 border border-purple-500/40'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Education</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900/60 text-[10px]">
                {education.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className={`grid gap-10 ${activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
          
          {/* ─── WORK EXPERIENCE COLUMN ─────────────────────────── */}
          {showExp && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Work Experience</h3>
                  <p className="text-xs text-slate-400">Engineering roles, internships &amp; professional projects</p>
                </div>
              </div>

              {experiences.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-sm">
                  No experience entries added yet.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-800 space-y-8">
                  {experiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        exp.isCurrent
                          ? 'bg-cyan-500 border-cyan-300 ring-4 ring-cyan-500/20'
                          : 'bg-slate-900 border-slate-700 group-hover:border-cyan-400 group-hover:bg-cyan-950'
                      }`} />

                      {/* Experience Card */}
                      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 hover:-translate-y-0.5">
                        {/* Top Metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {exp.company}
                          </span>

                          <div className="flex items-center gap-2">
                            {exp.employmentType && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {exp.employmentType}
                              </span>
                            )}
                            {exp.isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Present
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                          {exp.title}
                        </h4>

                        {/* Dates & Location */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                          </span>

                          {exp.location && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>{exp.location}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        {exp.description && (
                          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-4 whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}

                        {/* Tech tags */}
                        {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80">
                            {exp.technologies.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/40"
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
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Education &amp; Academics</h3>
                  <p className="text-xs text-slate-400">Degrees, formal qualifications &amp; academic programs</p>
                </div>
              </div>

              {education.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-sm">
                  No education entries added yet.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-800 space-y-8">
                  {education.map((edu, idx) => (
                    <div key={edu.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        edu.isCurrent
                          ? 'bg-purple-500 border-purple-300 ring-4 ring-purple-500/20'
                          : 'bg-slate-900 border-slate-700 group-hover:border-purple-400 group-hover:bg-purple-950'
                      }`} />

                      {/* Education Card */}
                      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 shadow-lg hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-0.5">
                        {/* Top Metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {edu.institution}
                          </span>

                          <div className="flex items-center gap-2">
                            {edu.grade && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/40 text-purple-300 border border-purple-800/40">
                                {edu.grade}
                              </span>
                            )}
                            {edu.isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                Enrolled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Degree */}
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                          {edu.degree}
                        </h4>

                        {/* Dates & Location */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{edu.startDate} – {edu.isCurrent ? 'Present' : edu.endDate}</span>
                          </span>

                          {edu.location && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>{edu.location}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        {edu.description && (
                          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-4 whitespace-pre-line">
                            {edu.description}
                          </p>
                        )}

                        {/* Key Activities / Modules */}
                        {Array.isArray(edu.activities) && edu.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80">
                            {edu.activities.map((act, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
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
