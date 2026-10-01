'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ExternalLink,
  Calendar,
  FileText,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Share2,
} from 'lucide-react';
import {
  subscribeToPublishedPublications,
  INITIAL_PUBLICATIONS,
} from '../lib/firestore';

const TYPE_STYLES = {
  'Conference Paper': {
    badge: 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    border: 'hover:border-cyan-500/40',
    glow: 'from-cyan-500/10 to-teal-500/5',
  },
  'Journal Article': {
    badge: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    border: 'hover:border-emerald-500/40',
    glow: 'from-emerald-500/10 to-green-500/5',
  },
  'Research Report': {
    badge: 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    border: 'hover:border-indigo-500/40',
    glow: 'from-indigo-500/10 to-purple-500/5',
  },
  'Preprint': {
    badge: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    border: 'hover:border-amber-500/40',
    glow: 'from-amber-500/10 to-orange-500/5',
  },
  'Other': {
    badge: 'bg-slate-500/10 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    border: 'hover:border-slate-500/40',
    glow: 'from-slate-500/10 to-slate-400/5',
  },
};

function getPublicationStyle(type) {
  return TYPE_STYLES[type] || TYPE_STYLES['Other'];
}

function PublicationCard({ pub, index }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const style = getPublicationStyle(pub.type);

  const handleCopyCitation = () => {
    const citation = `${pub.authors} (${pub.year}). "${pub.title}". ${pub.venue}.${pub.doi ? ` DOI: ${pub.doi}` : ''}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLongAbstract = (pub.abstract || '').length > 220;
  const displayAbstract = isLongAbstract && !expanded
    ? `${pub.abstract.slice(0, 220)}...`
    : pub.abstract;

  return (
    <div
      className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-900/80 dark:to-slate-950 p-5 sm:p-7 lg:p-8 flex flex-col justify-between transition-all duration-300 ${style.border} hover:-translate-y-1 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-xl dark:hover:shadow-cyan-500/5`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Ambient background light */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-gradient-to-bl ${style.glow} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div>
        {/* Header Tags: Type & Year */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 relative z-10">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${style.badge}`}>
            <BookOpen className="w-3.5 h-3.5" />
            <span>{pub.type || 'Publication'}</span>
          </span>

          {pub.year && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{pub.year}</span>
            </span>
          )}
        </div>

        {/* Paper Title */}
        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-200 transition-colors">
          {pub.title}
        </h3>

        {/* Authors */}
        <div className="mb-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Authors: </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {pub.authors.split(',').map((author, i) => {
              const isJahan = author.toLowerCase().includes('jahan') || author.toLowerCase().includes('ramesh');
              return (
                <span key={i}>
                  {i > 0 && ', '}
                  <span className={isJahan ? 'text-cyan-600 dark:text-cyan-300 font-bold underline decoration-cyan-500/50 underline-offset-2' : ''}>
                    {author.trim()}
                  </span>
                </span>
              );
            })}
          </span>
        </div>

        {/* Venue / Conference */}
        {pub.venue && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-slate-800/50 border border-cyan-200/60 dark:border-slate-700/50 text-xs text-cyan-800 dark:text-cyan-300/90 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
            <span>{pub.venue}</span>
          </div>
        )}

        {/* Abstract */}
        {pub.abstract && (
          <div className="mb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/70">
            <p className="whitespace-pre-line">{displayAbstract}</p>
            {isLongAbstract && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 inline-flex items-center gap-1 transition"
              >
                <span>{expanded ? 'Show Less' : 'Read Full Abstract'}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}

        {/* Keywords */}
        {Array.isArray(pub.keywords) && pub.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {pub.keywords.map((kw, kIdx) => (
              <span
                key={kIdx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/70"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                <span>{kw}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          {pub.paperUrl && (
            <a
              href={pub.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 dark:bg-cyan-500/15 hover:bg-cyan-700 dark:hover:bg-cyan-500/25 text-white dark:text-cyan-300 border border-cyan-600 dark:border-cyan-500/30 transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Read Paper</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {pub.doi && (
            <a
              href={pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
            >
              <span>DOI Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyCitation}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
          title="Copy Citation to Clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Citation Copied!' : 'Cite'}</span>
        </button>
      </div>
    </div>
  );
}

export default function ResearchPublications() {
  const [publications, setPublications] = useState(INITIAL_PUBLICATIONS);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const unsub = subscribeToPublishedPublications((items) => {
      setPublications(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const types = ['All', ...Array.from(new Set(publications.map((p) => p.type || 'Other')))];

  const filtered =
    activeFilter === 'All'
      ? publications
      : publications.filter((p) => (p.type || 'Other') === activeFilter);

  if (!loading && publications.length === 0) return null;

  return (
    <section id="publications" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/60 transition-colors duration-300">
      {/* Ambient background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Research &amp; Publications</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              Scholarly Works &amp;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-indigo-600 dark:from-cyan-400 dark:via-teal-300 dark:to-indigo-400">
                Publications
              </span>
            </h2>

            <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-base max-w-xl">
              Peer-reviewed research, academic conference papers, and technical reports focusing on cloud infrastructure, distributed microservices, and AI system optimization.
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
              {publications.length} Publication{publications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        {types.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {types.map((t) => {
              const isActive = activeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveFilter(t)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold border-cyan-500 shadow-md shadow-cyan-600/25'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white shadow-sm'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}

        {/* Publications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((pub, idx) => (
            <PublicationCard key={pub.id || idx} pub={pub} index={idx} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">
            No publications in this category yet.
          </div>
        )}
      </div>
    </section>
  );
}
