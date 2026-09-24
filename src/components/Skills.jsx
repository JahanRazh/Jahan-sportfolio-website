'use client';

import React from 'react';

export default function Skills() {
  const technicalSkills = [
    { name: 'HTML', percent: 80 },
    { name: 'Figma', percent: 90 },
    { name: 'JavaScript', percent: 70 },
    { name: 'CSS', percent: 90 },
    { name: 'PHP', percent: 70 },
    { name: 'Java', percent: 75 },
    { name: 'React', percent: 80 },
    { name: 'Nodejs', percent: 75 },
  ];

  const professionalSkills = [
    { name: 'Team Work', percent: 90 },
    { name: 'Creativity', percent: 85 },
    { name: 'Project Management', percent: 80 },
    { name: 'Communication', percent: 83 },
  ];

  return (
    <section id="skills" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-wider uppercase text-[#1e9fab] dark:text-[#12f7ff] mb-2">
            Technical & Professional
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My <span className="text-[#6e57e0] dark:text-[#12f7ff]">Skills</span>
          </h2>
          <div className="w-16 h-1 bg-[#6e57e0] dark:bg-[#12f7ff] rounded-full mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Technical Skills - Progress Bars */}
          <div className="lg:col-span-6 bg-white dark:bg-[#161f30] rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center sm:text-left">
              Technical Skills
            </h3>

            <div className="space-y-6">
              {technicalSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between items-center text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
                    <span>{skill.name}</span>
                    <span className="text-[#6e57e0] dark:text-[#12f7ff] font-bold">{skill.percent}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#6e57e0] to-[#00c9ff] dark:to-[#12f7ff] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(18,247,255,0.4)]"
                      style={{ width: `${skill.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Skills - Circular Progress Indicators */}
          <div className="lg:col-span-6 bg-white dark:bg-[#161f30] rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center sm:text-left">
              Professional Skills
            </h3>

            <div className="grid grid-cols-2 gap-6 sm:gap-8">
              {professionalSkills.map((skill) => {
                const radius = 42;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (skill.percent / 100) * circumference;

                return (
                  <div
                    key={skill.name}
                    className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-[#0c121e]/60 border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                        />
                        {/* Foreground animated circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          className="text-[#12f7ff]"
                          strokeWidth="8"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          style={{
                            transition: 'stroke-dashoffset 1.2s ease-in-out',
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {skill.percent}%
                        </span>
                      </div>
                    </div>
                    <span className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {skill.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
