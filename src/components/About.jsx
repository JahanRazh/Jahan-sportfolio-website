'use client';

import React from 'react';
import { Download, Code2, Server, Database } from 'lucide-react';

export default function About() {
  const skillCategories = [
    {
      title: 'Frontend',
      icon: Code2,
      color: 'from-blue-500 to-cyan-500',
      skills: ['HTML', 'CSS', 'Bootstrap', 'JavaScript', 'React'],
    },
    {
      title: 'Backend',
      icon: Server,
      color: 'from-purple-500 to-indigo-500',
      skills: ['PHP', 'JAVA', 'Python', 'C++', 'NodeJS', 'ExpressJS'],
    },
    {
      title: 'Database',
      icon: Database,
      color: 'from-emerald-500 to-teal-500',
      skills: ['MySQL', 'SQLite', 'MongoDB'],
    },
  ];

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
              My introduction
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg mb-8">
              I am a Software Engineering undergraduate student at SLIIT University.
              Passionate about coding, software development, and continuously learning
              new technologies and methodologies in the field. Skilled in programming
              languages such as Java, Python, and C++. Experienced in web development,
              mobile app development, and database management. Actively involved in
              university projects and extracurricular activities related to technology.
              Aspiring to build a successful career in software engineering and contribute
              to innovative and impactful projects in the tech industry.
            </p>

            <a
              href="/assets/cv/Jahan_Jayalath-CV.pdf"
              download="Jahan_Jayalath_CV.pdf"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#6e57e0] hover:bg-[#285bd4] transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5"
            >
              <span>Download CV</span>
              <Download className="w-4 h-4" />
            </a>
          </div>

          {/* Right Column: Skill Stacks */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {skillCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.title}
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
                    {cat.skills.map((skill) => (
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
