'use client';

import React, { useState } from 'react';
import {
  Award,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Star,
  Plus,
  ExternalLink,
  Calendar,
} from 'lucide-react';

const CATEGORY_COLORS = {
  'Web Development':     'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Mobile Development':  'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Cloud & DevOps':      'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'AI / Machine Learning': 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  'Cybersecurity':       'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'UI/UX Design':        'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  'Data Science':        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Database':            'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'General':             'bg-slate-500/15 text-slate-300 border-slate-500/30',
  'Other':               'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export default function CertificateTable({
  certificates,
  onEdit,
  onDelete,
  onTogglePublish,
  onAddNew,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = certificates.filter((cert) => {
    const q = searchQuery.toLowerCase();
    return (
      cert.title?.toLowerCase().includes(q) ||
      cert.issuer?.toLowerCase().includes(q) ||
      cert.category?.toLowerCase().includes(q)
    );
  });

  if (certificates.length === 0) {
    return (
      <div className="rounded-3xl bg-slate-900 border border-dashed border-slate-700 p-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Award className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white mb-1">No Certificates Yet</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            Add your first certificate or credential to show it on the public portfolio.
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Add First Certificate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search certificates by title, issuer, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition"
        />
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certificate</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Certificate</th>
              <th className="hidden md:table-cell text-left px-4 py-3">Category</th>
              <th className="hidden lg:table-cell text-left px-4 py-3">Issued</th>
              <th className="hidden sm:table-cell text-left px-4 py-3">File</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500 text-sm">
                  No certificates match your search.
                </td>
              </tr>
            ) : (
              filtered.map((cert) => {
                const catColor = CATEGORY_COLORS[cert.category] || CATEGORY_COLORS['General'];
                return (
                  <tr
                    key={cert.id}
                    className="bg-slate-900 hover:bg-slate-800/50 transition group"
                  >
                    {/* Title & Issuer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          {cert.thumbnailUrl ? (
                            <img
                              src={cert.thumbnailUrl}
                              alt={cert.title}
                              className="w-full h-full object-cover"
                            />
                          ) : cert.fileType === 'pdf' ? (
                            <FileText className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Award className="w-5 h-5 text-amber-400/50" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-white text-xs truncate max-w-[160px]">
                              {cert.title}
                            </p>
                            {cert.featured && (
                              <Star className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{cert.issuer}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catColor}`}>
                        {cert.category || 'General'}
                      </span>
                    </td>

                    {/* Issued date */}
                    <td className="hidden lg:table-cell px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {formatDate(cert.issuedDate)}
                      </div>
                    </td>

                    {/* File type badge */}
                    <td className="hidden sm:table-cell px-4 py-3">
                      {cert.fileUrl ? (
                        cert.fileType === 'pdf' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[10px] font-semibold">
                            <FileText className="w-3 h-3" />
                            PDF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-semibold">
                            <ImageIcon className="w-3 h-3" />
                            Image
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-600">No file</span>
                      )}
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onTogglePublish(cert)}
                        title={cert.published ? 'Click to unpublish' : 'Click to publish'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                          cert.published
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/30'
                        }`}
                      >
                        {cert.published ? (
                          <><Eye className="w-3 h-3" /> Live</>
                        ) : (
                          <><EyeOff className="w-3 h-3" /> Draft</>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Verify credential"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => onEdit(cert)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(cert)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 text-right">
        {filtered.length} of {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
