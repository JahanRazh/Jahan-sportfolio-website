'use client';

import React from 'react';
import { Github, ExternalLink, Star } from 'lucide-react';

export default function ProjectCard({ project }) {
  if (!project) return null;

  const {
    name,
    category,
    shortDescription,
    description,
    technologies = [],
    imageUrl,
    imageAlt,
    githubUrl,
    liveUrl,
    featured,
  } = project;

  const displayDescription = shortDescription || description || '';

  return (
    <div className="group relative bg-white dark:bg-[#161f30] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-lg shadow-slate-200/50 dark:shadow-black/40 hover:shadow-2xl hover:border-[#6e57e0]/60 dark:hover:border-[#12f7ff]/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5">
      {/* Top Image Preview Container */}
      <div className="relative w-full h-52 sm:h-56 bg-slate-900 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || `${name} preview`}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-500 font-medium text-sm">
            No Preview Available
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#12f7ff] border border-[#12f7ff]/30">
            {category || 'Project'}
          </span>
        </div>

        {/* Featured Star Badge */}
        {featured && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/90 text-slate-950 backdrop-blur-md shadow-md">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Featured</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#6e57e0] dark:group-hover:text-[#12f7ff] transition-colors">
            {name}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
            {displayDescription}
          </p>

          {/* Technology Tags */}
          {technologies && technologies.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-[#6e57e0] hover:text-white dark:hover:bg-[#6e57e0] dark:hover:text-white transition duration-200"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          )}

          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#00c9ff]/15 text-[#00a8d6] dark:text-[#12f7ff] hover:bg-[#00c9ff] hover:text-white dark:hover:bg-[#00c9ff] dark:hover:text-slate-900 border border-[#00c9ff]/30 transition duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Live Demo</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
