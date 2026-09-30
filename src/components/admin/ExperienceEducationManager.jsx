'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Building2,
  Sparkles,
  Check,
  X,
  Loader2,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import {
  subscribeToAllExperiences,
  subscribeToAllEducation,
  createExperience,
  updateExperience,
  deleteExperience,
  createEducation,
  updateEducation,
  deleteEducation,
  seedInitialExperiences,
  seedInitialEducation,
} from '../../lib/firestore';
import { useToast } from '../Toast';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function ExperienceEducationManager() {
  const { addToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('experience'); // 'experience' | 'education'
  const [searchQuery, setSearchQuery] = useState('');

  // Experiences state
  const [experiences, setExperiences] = useState([]);
  const [loadingExp, setLoadingExp] = useState(true);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [selectedExpForEdit, setSelectedExpForEdit] = useState(null);

  // Education state
  const [education, setEducation] = useState([]);
  const [loadingEdu, setLoadingEdu] = useState(true);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [selectedEduForEdit, setSelectedEduForEdit] = useState(null);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('experience');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubExp = subscribeToAllExperiences((items) => {
      setExperiences(items);
      setLoadingExp(false);
    });

    const unsubEdu = subscribeToAllEducation((items) => {
      setEducation(items);
      setLoadingEdu(false);
    });

    return () => {
      unsubExp();
      unsubEdu();
    };
  }, []);

  // ── Experience Handlers ──────────────────────────────────────────────────

  const handleOpenAddExp = () => {
    setSelectedExpForEdit(null);
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (exp) => {
    setSelectedExpForEdit(exp);
    setIsExpModalOpen(true);
  };

  const handleSaveExp = async (data) => {
    try {
      if (selectedExpForEdit && selectedExpForEdit.id) {
        await updateExperience(selectedExpForEdit.id, data);
        addToast('Experience updated successfully!', 'success');
      } else {
        await createExperience(data);
        addToast('New experience entry added!', 'success');
      }
      setIsExpModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to save experience', 'error');
    }
  };

  const handleTogglePublishExp = async (exp) => {
    try {
      const nextStatus = !exp.published;
      await updateExperience(exp.id, { published: nextStatus });
      addToast(`Experience ${nextStatus ? 'published' : 'moved to draft'}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  // ── Education Handlers ───────────────────────────────────────────────────

  const handleOpenAddEdu = () => {
    setSelectedEduForEdit(null);
    setIsEduModalOpen(true);
  };

  const handleOpenEditEdu = (edu) => {
    setSelectedEduForEdit(edu);
    setIsEduModalOpen(true);
  };

  const handleSaveEdu = async (data) => {
    try {
      if (selectedEduForEdit && selectedEduForEdit.id) {
        await updateEducation(selectedEduForEdit.id, data);
        addToast('Education updated successfully!', 'success');
      } else {
        await createEducation(data);
        addToast('New education entry added!', 'success');
      }
      setIsEduModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to save education', 'error');
    }
  };

  const handleTogglePublishEdu = async (edu) => {
    try {
      const nextStatus = !edu.published;
      await updateEducation(edu.id, { published: nextStatus });
      addToast(`Education ${nextStatus ? 'published' : 'moved to draft'}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  // ── Delete Handler ───────────────────────────────────────────────────────

  const handleRequestDelete = (item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (deleteType === 'experience') {
        await deleteExperience(itemToDelete.id);
        addToast('Experience deleted successfully', 'success');
      } else {
        await deleteEducation(itemToDelete.id);
        addToast('Education deleted successfully', 'success');
      }
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } catch (err) {
      addToast('Error deleting item: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seedInitialExperiences();
      await seedInitialEducation();
      addToast('Default Experience & Education seeded successfully!', 'success');
    } catch (err) {
      addToast('Error seeding defaults: ' + err.message, 'error');
    }
  };

  // Filtered items
  const q = searchQuery.toLowerCase();
  const filteredExperiences = experiences.filter((e) =>
    e.title?.toLowerCase().includes(q) ||
    e.company?.toLowerCase().includes(q) ||
    e.location?.toLowerCase().includes(q)
  );

  const filteredEducation = education.filter((e) =>
    e.degree?.toLowerCase().includes(q) ||
    e.institution?.toLowerCase().includes(q) ||
    e.location?.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </span>
            <span>Experience &amp; Education Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage your professional career history, engineering roles, and academic qualifications at SLIIT.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {experiences.length === 0 && education.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
              title="Seed initial SLIIT education and sample experience"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Seed Default Entries</span>
            </button>
          )}

          {activeSubTab === 'experience' ? (
            <button
              onClick={handleOpenAddExp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Experience</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddEdu}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Education</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Sub-tab pills */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setActiveSubTab('experience')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'experience'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Work Experience</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/40 text-[10px]">
              {experiences.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('education')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'education'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Education</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/40 text-[10px]">
              {education.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={activeSubTab === 'experience' ? 'Search by role, company, location...' : 'Search by degree, institution, location...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* ─── TAB 1: WORK EXPERIENCE TABLE ─────────────────────────────────── */}
      {activeSubTab === 'experience' && (
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
          {filteredExperiences.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-white">No Work Experience Entries</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? 'No experiences match your search query.' : 'Add your current or past engineering positions.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-700/80">
                  <tr>
                    <th className="px-4 py-3">Role &amp; Company</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Type &amp; Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredExperiences.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-white text-sm leading-snug">{exp.title}</p>
                        <p className="text-xs text-cyan-400 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-cyan-500" />
                          <span>{exp.company}</span>
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                        </div>
                        {exp.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Current Role
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          {exp.employmentType && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {exp.employmentType}
                            </span>
                          )}
                          {exp.location && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[140px]">{exp.location}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublishExp(exp)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                            exp.published
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-700/60 text-slate-400 border border-slate-600 hover:text-white'
                          }`}
                        >
                          {exp.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{exp.published ? 'Live' : 'Draft'}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExp(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Experience"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(exp, 'experience')}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Delete Experience"
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
      )}

      {/* ─── TAB 2: EDUCATION TABLE ────────────────────────────────────────── */}
      {activeSubTab === 'education' && (
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
          {filteredEducation.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <GraduationCap className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-white">No Education Entries</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? 'No education matches your search query.' : 'Add your university degree, school, or qualifications.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-700/80">
                  <tr>
                    <th className="px-4 py-3">Degree &amp; Institution</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Grade / Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredEducation.map((edu) => (
                    <tr key={edu.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-white text-sm leading-snug">{edu.degree}</p>
                        <p className="text-xs text-purple-400 font-medium flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3 h-3 text-purple-500" />
                          <span>{edu.institution}</span>
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{edu.startDate} – {edu.isCurrent ? 'Present' : edu.endDate}</span>
                        </div>
                        {edu.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                            Enrolled
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          {edu.grade && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/40 text-purple-300 border border-purple-800/40">
                              {edu.grade}
                            </span>
                          )}
                          {edu.location && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[140px]">{edu.location}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublishEdu(edu)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                            edu.published
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-700/60 text-slate-400 border border-slate-600 hover:text-white'
                          }`}
                        >
                          {edu.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{edu.published ? 'Live' : 'Draft'}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEdu(edu)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Education"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(edu, 'education')}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Delete Education"
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
      )}

      {/* ─── MODAL 1: EXPERIENCE MODAL ────────────────────────────────────── */}
      {isExpModalOpen && (
        <ExperienceFormModal
          isOpen={isExpModalOpen}
          onClose={() => setIsExpModalOpen(false)}
          onSave={handleSaveExp}
          initialData={selectedExpForEdit}
        />
      )}

      {/* ─── MODAL 2: EDUCATION MODAL ─────────────────────────────────────── */}
      {isEduModalOpen && (
        <EducationFormModal
          isOpen={isEduModalOpen}
          onClose={() => setIsEduModalOpen(false)}
          onSave={handleSaveEdu}
          initialData={selectedEduForEdit}
        />
      )}

      {/* ─── MODAL 3: DELETE CONFIRMATION ─────────────────────────────────── */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={itemToDelete?.title || itemToDelete?.degree}
        isDeleting={isDeleting}
      />
    </div>
  );
}

// ─── Experience Form Modal ─────────────────────────────────────────────────

function ExperienceFormModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: 'Full-time',
    startDate: '',
    endDate: 'Present',
    isCurrent: true,
    description: '',
    technologies: '',
    order: 1,
    published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        company: initialData.company || '',
        location: initialData.location || '',
        employmentType: initialData.employmentType || 'Full-time',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || 'Present',
        isCurrent: Boolean(initialData.isCurrent),
        description: initialData.description || '',
        technologies: Array.isArray(initialData.technologies) ? initialData.technologies.join(', ') : '',
        order: initialData.order !== undefined ? Number(initialData.order) : 1,
        published: initialData.published !== undefined ? Boolean(initialData.published) : true,
      });
    } else {
      setFormData({
        title: '',
        company: '',
        location: '',
        employmentType: 'Full-time',
        startDate: '',
        endDate: 'Present',
        isCurrent: true,
        description: '',
        technologies: '',
        order: 1,
        published: true,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const techArray = formData.technologies
      ? formData.technologies.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    onSave({
      ...formData,
      endDate: formData.isCurrent ? 'Present' : formData.endDate,
      technologies: techArray,
      order: Number(formData.order) || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <span>{initialData ? 'Edit Work Experience' : 'Add Work Experience'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Job Title / Role *</label>
            <input
              type="text"
              required
              placeholder="e.g. Full Stack Developer, Software Engineering Intern"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Freelance, Tech Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. Colombo, Sri Lanka / Remote"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Date *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jan 2023 or 2023-01"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">End Date</label>
              <input
                type="text"
                disabled={formData.isCurrent}
                placeholder="e.g. Dec 2024 or Present"
                value={formData.isCurrent ? 'Present' : formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentExp"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <label htmlFor="isCurrentExp" className="text-xs text-slate-300 cursor-pointer">
              I currently work here (Present)
            </label>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Responsibilities &amp; Achievements</label>
            <textarea
              rows={3}
              placeholder="Describe your role, accomplishments, and responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Technologies / Tools (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. React, Next.js, Node.js, Firebase, MySQL"
              value={formData.technologies}
              onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isPubExp"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="isPubExp" className="text-xs text-slate-300 cursor-pointer font-semibold">
                Publish on Live Site
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
            >
              Save Experience
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Education Form Modal ──────────────────────────────────────────────────

function EducationFormModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: 'Present',
    isCurrent: true,
    grade: '',
    description: '',
    activities: '',
    order: 1,
    published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        degree: initialData.degree || '',
        institution: initialData.institution || '',
        location: initialData.location || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || 'Present',
        isCurrent: Boolean(initialData.isCurrent),
        grade: initialData.grade || '',
        description: initialData.description || '',
        activities: Array.isArray(initialData.activities) ? initialData.activities.join(', ') : '',
        order: initialData.order !== undefined ? Number(initialData.order) : 1,
        published: initialData.published !== undefined ? Boolean(initialData.published) : true,
      });
    } else {
      setFormData({
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: 'Present',
        isCurrent: true,
        grade: '',
        description: '',
        activities: '',
        order: 1,
        published: true,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const actArray = formData.activities
      ? formData.activities.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    onSave({
      ...formData,
      endDate: formData.isCurrent ? 'Present' : formData.endDate,
      activities: actArray,
      order: Number(formData.order) || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-400" />
            <span>{initialData ? 'Edit Education Entry' : 'Add Education Entry'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Degree / Qualification *</label>
            <input
              type="text"
              required
              placeholder="e.g. BSc (Hons) in Information Technology - Software Engineering"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Institution / University *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sri Lanka Institute of Information Technology (SLIIT)"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Malabe, Sri Lanka"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Grade / Status</label>
              <input
                type="text"
                placeholder="e.g. Undergraduate, Second Upper, GPA 3.6"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Year / Date *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2022"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">End Year / Date</label>
              <input
                type="text"
                disabled={formData.isCurrent}
                placeholder="e.g. 2026 or Present"
                value={formData.isCurrent ? 'Present' : formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentEdu"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
            />
            <label htmlFor="isCurrentEdu" className="text-xs text-slate-300 cursor-pointer">
              Currently studying here (Enrolled)
            </label>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Specialization &amp; Coursework</label>
            <textarea
              rows={3}
              placeholder="e.g. Software engineering architecture, algorithms, cloud computing..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Key Activities &amp; Clubs (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. IEEE Student Member, Hackathons, Software Engineering Society"
              value={formData.activities}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isPubEdu"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
              />
              <label htmlFor="isPubEdu" className="text-xs text-slate-300 cursor-pointer font-semibold">
                Publish on Live Site
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/20"
            >
              Save Education
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
