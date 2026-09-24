'use client';

import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import { getPublishedProjects } from '../lib/firestore';
import { Sparkles, Layers, RefreshCw } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getPublishedProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const categories = ['All', ...new Set(projects.map((p) => p.category).filter(Boolean))];

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  const featuredProjects = filteredProjects.filter((p) => p.featured);
  const otherProjects = filteredProjects.filter((p) => !p.featured);

  return (
    <section id="projects" className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-[#0c121e]/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-wider uppercase text-[#1e9fab] dark:text-[#12f7ff] mb-2">
            My Portfolio
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Recent <span className="text-[#6e57e0] dark:text-[#12f7ff]">Projects</span>
          </h2>
          <div className="w-16 h-1 bg-[#6e57e0] dark:bg-[#12f7ff] rounded-full mx-auto mt-3" />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-14">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#6e57e0] text-white shadow-lg shadow-indigo-500/25 scale-105'
                  : 'bg-white dark:bg-[#161f30] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#6e57e0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading Skeleton State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-[#161f30] rounded-3xl h-96 border border-slate-200 dark:border-slate-800 animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
                <div className="space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                </div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#161f30] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto p-8">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No projects found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              There are currently no published projects in this category.
            </p>
            <button
              onClick={fetchProjects}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6e57e0] text-white text-sm font-medium hover:bg-[#285bd4] transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Projects</span>
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Projects Section */}
            {featuredProjects.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-8">
                  <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Featured Projects
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {/* All / Other Projects Section */}
            {otherProjects.length > 0 && (
              <div>
                {featuredProjects.length > 0 && (
                  <div className="flex items-center gap-2.5 mb-8 pt-4">
                    <Layers className="w-5 h-5 text-[#6e57e0] dark:text-[#12f7ff]" />
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      All Projects
                    </h3>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {otherProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
