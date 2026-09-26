'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Sliders,
  Award,
  DatabaseBackup,
  Loader2,
  Eye,
  EyeOff,
  Briefcase,
  Code2,
} from 'lucide-react';
import { useToast } from '../Toast';
import {
  createSkill,
  updateSkill,
  deleteSkill,
  seedInitialSkills,
} from '../../lib/firestore';

export default function SkillsManager({ skills = [], loading = false }) {
  const { addToast } = useToast();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'technical' | 'professional'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null); // skill id being deleted
  const [isSeeding, setIsSeeding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    percent: 80,
    type: 'technical',
    order: 1,
    published: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const filteredSkills = skills.filter((s) => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  const technicalCount = skills.filter((s) => s.type === 'technical').length;
  const professionalCount = skills.filter((s) => s.type === 'professional').length;

  const handleOpenAdd = (type = 'technical') => {
    setEditingSkill(null);
    setFormData({
      name: '',
      percent: 80,
      type: type,
      order: skills.length + 1,
      published: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name || '',
      percent: skill.percent || 50,
      type: skill.type || 'technical',
      order: skill.order || 1,
      published: skill.published !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Skill name is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSkill && editingSkill.id) {
        await updateSkill(editingSkill.id, formData);
        addToast(`Skill "${formData.name}" updated!`, 'success');
      } else {
        await createSkill(formData);
        addToast(`Skill "${formData.name}" created!`, 'success');
      }
      setIsModalOpen(false);
      setEditingSkill(null);
    } catch (err) {
      addToast(err.message || 'Failed to save skill', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (skill) => {
    if (!window.confirm(`Are you sure you want to delete "${skill.name}"?`)) return;
    setIsDeleting(skill.id);
    try {
      await deleteSkill(skill.id);
      addToast(`Deleted skill "${skill.name}"`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to delete skill', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTogglePublish = async (skill) => {
    try {
      const next = !skill.published;
      await updateSkill(skill.id, { published: next });
      addToast(`Skill "${skill.name}" ${next ? 'published' : 'hidden'}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedInitialSkills();
      addToast('Default technical & professional skills added!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to seed skills', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Skills Management</h2>
            <p className="text-xs text-slate-400">
              Add, edit, adjust proficiency, and reorder technical & professional skills.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {skills.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
            >
              {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DatabaseBackup className="w-3.5 h-3.5" />}
              <span>Seed Defaults</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAdd(filterType === 'professional' ? 'professional' : 'technical')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Skill</span>
          </button>
        </div>
      </div>

      {/* Tabs / Filter Pills */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            filterType === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>All Skills</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {skills.length}
          </span>
        </button>

        <button
          onClick={() => setFilterType('technical')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            filterType === 'technical'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Technical Skills</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {technicalCount}
          </span>
        </button>

        <button
          onClick={() => setFilterType('professional')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            filterType === 'professional'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Professional Skills</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {professionalCount}
          </span>
        </button>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
          <p className="text-sm font-medium">Loading skills...</p>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No skills found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Click "Seed Defaults" to populate original skills, or click "Add New Skill" to create one.
          </p>
          <button
            onClick={handleSeed}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
          >
            Load Default Skills
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const isTech = skill.type === 'technical';
            const isHidden = skill.published === false;

            return (
              <div
                key={skill.id}
                className={`p-5 rounded-2xl border transition-all duration-300 bg-slate-900/80 flex flex-col justify-between ${
                  isHidden
                    ? 'border-slate-800/50 opacity-60'
                    : isTech
                    ? 'border-slate-800 hover:border-indigo-500/40'
                    : 'border-slate-800 hover:border-pink-500/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isTech
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                        }`}
                      >
                        {isTech ? 'Technical' : 'Professional'}
                      </span>
                      {isHidden && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Draft / Hidden
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-extrabold text-white">
                      {skill.percent}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{skill.name}</h3>

                  {/* Progress bar preview */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTech
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                          : 'bg-gradient-to-r from-pink-500 to-rose-400'
                      }`}
                      style={{ width: `${skill.percent}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePublish(skill)}
                      title={isHidden ? 'Publish on website' : 'Hide from website'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      {isHidden ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">Order: {skill.order || 1}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(skill)}
                      title="Edit Skill"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(skill)}
                      disabled={isDeleting === skill.id}
                      title="Delete Skill"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition"
                    >
                      {isDeleting === skill.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Skill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingSkill ? 'Edit Skill' : 'Add New Skill'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Skill Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'technical' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      formData.type === 'technical'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}
                  >
                    Technical Skill
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'professional' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      formData.type === 'professional'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}
                  >
                    Professional Skill
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Skill Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Next.js, Docker, Problem Solving..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Proficiency Percentage */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Proficiency Percentage
                  </label>
                  <span className="text-sm font-extrabold text-cyan-400">{formData.percent}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.percent}
                  onChange={(e) => setFormData({ ...formData, percent: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Order & Published */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="skillPublished"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-0"
                  />
                  <label htmlFor="skillPublished" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Show on website
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSkill ? 'Save Changes' : 'Create Skill'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
