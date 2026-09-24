'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  Plus, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export default function ProjectTable({
  projects = [],
  onEdit,
  onDelete,
  onTogglePublish,
  onAddNew,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PUBLISHED, DRAFT, FEATURED

  // Filter projects by search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(project.technologies) &&
        project.technologies.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    if (filterStatus === 'PUBLISHED') return project.published === true;
    if (filterStatus === 'DRAFT') return project.published === false;
    if (filterStatus === 'FEATURED') return project.featured === true;

    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-black/20">
      {/* Controls Bar */}
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, category, or tech..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 self-stretch sm:self-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PUBLISHED', label: 'Published' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'FEATURED', label: 'Featured' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="py-20 text-center px-4">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No projects found</h3>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            Try adjusting your search query or filter, or click below to create a new project.
          </p>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Project</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Technologies</th>
                <th className="py-4 px-4 text-center">Order</th>
                <th className="py-4 px-4 text-center">Featured</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Thumbnail & Title */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                        {project.imageUrl ? (
                          <img
                            src={project.imageUrl}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate max-w-[200px] sm:max-w-xs group-hover:text-cyan-400 transition-colors">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                          {project.shortDescription}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {project.category || 'General'}
                    </span>
                  </td>

                  {/* Technologies */}
                  <td className="py-4 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {project.technologies?.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies?.length > 3 && (
                        <span className="text-[11px] text-slate-400 self-center">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Order */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="text-xs font-semibold text-slate-300 px-2 py-1 rounded bg-slate-800/80">
                      #{project.order || 1}
                    </span>
                  </td>

                  {/* Featured */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {project.featured ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">No</span>
                    )}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onTogglePublish(project)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                        project.published
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {project.published ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Draft</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(project)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit project"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(project)}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
