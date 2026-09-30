'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
  Sparkles,
  Search,
  X,
  FileText,
} from 'lucide-react';
import {
  subscribeToAllPublications,
  createPublication,
  updatePublication,
  deletePublication,
  seedInitialPublications,
} from '../../lib/firestore';
import { useToast } from '../Toast';
import DeleteConfirmModal from './DeleteConfirmModal';

const TYPE_COLORS = {
  'Conference Paper': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Journal Article': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Research Report': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'Preprint': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Other': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export default function PublicationsManager() {
  const { addToast } = useToast();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPubForEdit, setSelectedPubForEdit] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [pubToDelete, setPubToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllPublications((items) => {
      setPublications(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setSelectedPubForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pub) => {
    setSelectedPubForEdit(pub);
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      if (selectedPubForEdit && selectedPubForEdit.id) {
        await updatePublication(selectedPubForEdit.id, data);
        addToast('Publication updated successfully!', 'success');
      } else {
        await createPublication(data);
        addToast('New publication added successfully!', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to save publication', 'error');
    }
  };

  const handleTogglePublish = async (pub) => {
    try {
      const nextStatus = !pub.published;
      await updatePublication(pub.id, { published: nextStatus });
      addToast(`Publication ${nextStatus ? 'published' : 'moved to draft'}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleRequestDelete = (pub) => {
    setPubToDelete(pub);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pubToDelete) return;
    setIsDeleting(true);
    try {
      await deletePublication(pubToDelete.id);
      addToast('Publication deleted successfully', 'success');
      setIsDeleteOpen(false);
      setPubToDelete(null);
    } catch (err) {
      addToast('Error deleting publication: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seedInitialPublications();
      addToast('Default research publications seeded successfully!', 'success');
    } catch (err) {
      addToast('Error seeding publications: ' + err.message, 'error');
    }
  };

  const q = searchQuery.toLowerCase();
  const filtered = publications.filter((p) => {
    if (typeFilter !== 'all' && (p.type || 'Other') !== typeFilter) return false;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.venue?.toLowerCase().includes(q) ||
      p.authors?.toLowerCase().includes(q) ||
      p.abstract?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <span>Research &amp; Publications Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage academic conference papers, research articles, symposium presentations, and scientific preprints.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {publications.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition"
              title="Seed sample academic research entries"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Seed Sample Papers</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Publication</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'Conference Paper', 'Journal Article', 'Research Report', 'Preprint'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                typeFilter === t
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{t === 'all' ? 'All Types' : t}</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search papers by title, venue, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Publications Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-white">No Publications Found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'No publications match your search query.' : 'Add your first research paper or publication.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="px-4 py-3">Paper Title &amp; Venue</th>
                  <th className="px-4 py-3">Authors</th>
                  <th className="px-4 py-3">Type &amp; Year</th>
                  <th className="px-4 py-3">Links</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((pub) => {
                  const typeBadge = TYPE_COLORS[pub.type] || TYPE_COLORS['Other'];
                  return (
                    <tr key={pub.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 max-w-sm">
                        <p className="font-bold text-white text-sm leading-snug line-clamp-2">{pub.title}</p>
                        {pub.venue && (
                          <p className="text-xs text-cyan-400 font-medium mt-1 truncate">
                            {pub.venue}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-300 max-w-[200px] truncate">
                        {pub.authors}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeBadge}`}>
                          {pub.type || 'Other'}
                        </span>
                        {pub.year && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{pub.year}</span>
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {pub.paperUrl && (
                            <a
                              href={pub.paperUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition"
                              title="Open Paper Link"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                          {pub.doi && (
                            <a
                              href={pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition text-[10px] font-mono"
                              title="DOI Link"
                            >
                              DOI
                            </a>
                          )}
                          {!pub.paperUrl && !pub.doi && <span className="text-slate-600">—</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(pub)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                            pub.published
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-700/60 text-slate-400 border border-slate-600 hover:text-white'
                          }`}
                        >
                          {pub.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{pub.published ? 'Live' : 'Draft'}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(pub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Publication"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(pub)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Delete Publication"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <PublicationFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedPubForEdit}
        />
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={pubToDelete?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}

function PublicationFormModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    venue: '',
    year: new Date().getFullYear().toString(),
    type: 'Conference Paper',
    doi: '',
    paperUrl: '',
    abstract: '',
    keywords: '',
    order: 1,
    published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        authors: initialData.authors || '',
        venue: initialData.venue || '',
        year: initialData.year || '',
        type: initialData.type || 'Conference Paper',
        doi: initialData.doi || '',
        paperUrl: initialData.paperUrl || '',
        abstract: initialData.abstract || '',
        keywords: Array.isArray(initialData.keywords) ? initialData.keywords.join(', ') : '',
        order: initialData.order !== undefined ? Number(initialData.order) : 1,
        published: initialData.published !== undefined ? Boolean(initialData.published) : true,
      });
    } else {
      setFormData({
        title: '',
        authors: 'Ramesh Jahan Jayalath',
        venue: '',
        year: new Date().getFullYear().toString(),
        type: 'Conference Paper',
        doi: '',
        paperUrl: '',
        abstract: '',
        keywords: '',
        order: 1,
        published: true,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const kwArray = formData.keywords
      ? formData.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [];

    onSave({
      ...formData,
      keywords: kwArray,
      order: Number(formData.order) || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>{initialData ? 'Edit Publication' : 'Add Research Publication'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Paper / Publication Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Optimizing Cloud Microservices and Multi-Model AI Pipelines..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Authors (comma separated) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Jahan Jayalath, Dr. Jane Doe, John Smith"
              value={formData.authors}
              onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Publication Venue / Conference *</label>
              <input
                type="text"
                required
                placeholder="e.g. IEEE ICAIC 2024 / Springer"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Publication Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Conference Paper">Conference Paper</option>
                <option value="Journal Article">Journal Article</option>
                <option value="Research Report">Research Report</option>
                <option value="Preprint">Preprint</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Year / Date</label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">DOI / Link</label>
              <input
                type="text"
                placeholder="e.g. 10.1109/EXAMPLE.2024.10001 or URL"
                value={formData.doi}
                onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Paper URL / PDF Link (ArXiv, IEEE, etc.)</label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.paperUrl}
              onChange={(e) => setFormData({ ...formData, paperUrl: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Abstract / Executive Summary</label>
            <textarea
              rows={4}
              placeholder="Abstract overview of the research findings, methodology, and results..."
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Keywords / Subject Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Cloud Computing, Generative AI, Microservices, Scalability"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
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
                id="isPubItem"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="isPubItem" className="text-xs text-slate-300 cursor-pointer font-semibold">
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
              Save Publication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
