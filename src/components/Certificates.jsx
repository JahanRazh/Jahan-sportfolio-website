'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Award,
  ExternalLink,
  FileText,
  Calendar,
  ShieldCheck,
  Star,
  ChevronRight,
  Eye,
  X,
  Download,
  Loader2,
  Maximize2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { subscribeToPublishedCertificates } from '../lib/firestore';

// ─── helpers ───────────────────────────────────────────────────────────────

const CATEGORY_BADGE_STYLES = {
  'Web Development':       { bg: 'from-cyan-500/20 to-teal-500/20',    border: 'border-cyan-500/30',    text: 'text-cyan-300'    },
  'Mobile Development':    { bg: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30',  text: 'text-violet-300'  },
  'Cloud & DevOps':        { bg: 'from-sky-500/20 to-blue-500/20',      border: 'border-sky-500/30',     text: 'text-sky-300'     },
  'AI / Machine Learning': { bg: 'from-pink-500/20 to-rose-500/20',     border: 'border-pink-500/30',    text: 'text-pink-300'    },
  'Cybersecurity':         { bg: 'from-rose-500/20 to-red-500/20',      border: 'border-rose-500/30',    text: 'text-rose-300'    },
  'UI/UX Design':          { bg: 'from-fuchsia-500/20 to-pink-500/20',  border: 'border-fuchsia-500/30', text: 'text-fuchsia-300' },
  'Data Science':          { bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  'Database':              { bg: 'from-teal-500/20 to-cyan-500/20',     border: 'border-teal-500/30',    text: 'text-teal-300'    },
  'General':               { bg: 'from-amber-500/20 to-yellow-500/20',  border: 'border-amber-500/30',   text: 'text-amber-300'   },
  'Other':                 { bg: 'from-slate-500/20 to-slate-400/20',   border: 'border-slate-500/30',   text: 'text-slate-300'   },
};

function getStyle(category) {
  return CATEGORY_BADGE_STYLES[category] || CATEGORY_BADGE_STYLES['General'];
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
}

/**
 * Convert a Cloudinary raw/PDF URL to an inline-viewable URL.
 * Adds fl_attachment:false so the browser renders it instead of downloading.
 * If it's already an image URL, return as-is.
 */
function makeInlineUrl(url) {
  if (!url) return url;
  // Cloudinary raw upload URL format: /raw/upload/
  if (url.includes('/raw/upload/')) {
    return url.replace('/raw/upload/', '/raw/upload/fl_attachment:false/');
  }
  return url;
}

/**
 * Google Docs viewer URL – works for any public PDF URL cross-browser.
 */
function googleDocsViewerUrl(pdfUrl) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
}

// ─── PDF Viewer Modal ──────────────────────────────────────────────────────

function PdfViewerModal({ cert, onClose }) {
  // Always start with Google Docs Viewer — avoids Cloudinary X-Frame-Options block
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const timerRef = useRef(null);

  const googleUrl = googleDocsViewerUrl(cert.fileUrl);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 12-second timeout: if still loading, show the help panel
  useEffect(() => {
    setLoading(true);
    setTimedOut(false);
    timerRef.current = setTimeout(() => {
      setTimedOut(true);
      setLoading(false);
    }, 12000);
    return () => clearTimeout(timerRef.current);
  }, [viewerKey]);

  const handleIframeLoad = () => {
    clearTimeout(timerRef.current);
    setLoading(false);
    setTimedOut(false);
  };

  const handleRetry = () => {
    setLoading(true);
    setTimedOut(false);
    setViewerKey((k) => k + 1);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative flex flex-col w-full h-full max-w-5xl mx-auto my-4 sm:my-6 px-4">
        {/* Header bar */}
        <div className="relative z-10 flex items-center justify-between bg-slate-900/95 border border-slate-700 rounded-t-2xl px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{cert.title}</p>
              <p className="text-slate-400 text-xs truncate">{cert.issuer}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* Open in new tab — always works */}
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            {/* Download */}
            <a
              href={cert.fileUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer area */}
        <div className="relative flex-1 bg-slate-950 border-x border-b border-slate-700 rounded-b-2xl overflow-hidden">

          {/* Loading spinner */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 z-10 pointer-events-none">
              <Loader2 className="w-9 h-9 text-amber-400 animate-spin" />
              <p className="text-slate-300 text-sm font-medium">Loading PDF...</p>
              <p className="text-slate-500 text-xs">via Google Docs Viewer</p>
            </div>
          )}

          {/* Timed-out fallback panel */}
          {timedOut && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-950 z-10 p-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base mb-1">Can&apos;t preview this PDF</p>
                <p className="text-slate-400 text-sm max-w-xs">
                  The embedded viewer couldn&apos;t load. Use one of these options to view the certificate:
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition shadow-lg shadow-amber-500/30"
                >
                  <Maximize2 className="w-4 h-4" />
                  Open PDF in New Tab
                </a>
                <a
                  href={cert.fileUrl}
                  download
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium border border-slate-700 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Google Docs Viewer iframe */}
          <iframe
            key={`gdocs-${viewerKey}`}
            src={googleUrl}
            title={cert.title}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Image Viewer Modal ────────────────────────────────────────────────────

function ImageViewerModal({ cert, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/95 border border-slate-700 rounded-2xl px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{cert.title}</p>
              <p className="text-slate-400 text-xs">{cert.issuer}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Size</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
          <img
            src={cert.fileUrl || cert.thumbnailUrl}
            alt={cert.title}
            className="w-full max-h-[75vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Certificate Card ──────────────────────────────────────────────────────

function getCertificatePreviewUrl(cert) {
  if (cert.thumbnailUrl) return cert.thumbnailUrl;
  if (!cert.fileUrl) return null;

  // Direct image URLs
  if (cert.fileUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i)) {
    return cert.fileUrl;
  }

  // Cloudinary image upload PDF converted to JPG
  if (cert.fileUrl.includes('/image/upload/') && cert.fileUrl.includes('.pdf')) {
    return cert.fileUrl.replace(/\.pdf(\?.*)?$/i, '.jpg');
  }

  // Pre-rendered previews for existing certificates
  if (cert.fileUrl.includes('wrr1lkglqt7lc1lgqdpg.pdf')) {
    return 'https://res.cloudinary.com/dplnxifrx/image/upload/w_800,c_limit,q_auto,f_auto/v1790413761/portfolio-certificates/mioljkjvxiiqvn9vkrur.jpg';
  }
  if (cert.fileUrl.includes('g5a4wuo8cdlwsaichj9g.pdf')) {
    return 'https://res.cloudinary.com/dplnxifrx/image/upload/w_800,c_limit,q_auto,f_auto/v1790413687/portfolio-certificates/dqqtdtyjbs4himd4tbzm.jpg';
  }

  // Fallback for any Cloudinary raw upload
  if (cert.fileUrl.includes('/raw/upload/')) {
    return cert.fileUrl.replace('/raw/upload/', '/image/upload/').replace(/\.pdf(\?.*)?$/i, '.jpg');
  }

  return null;
}

function CertificateCard({ cert, index, onViewFile }) {
  const style = getStyle(cert.category);
  const issuedFormatted = formatDate(cert.issuedDate);
  const expiryFormatted = formatDate(cert.expiryDate);
  const isPdf = cert.fileType === 'pdf';
  const previewImg = getCertificatePreviewUrl(cert);

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-900/20 flex flex-col justify-between"
      style={{ borderColor: 'rgba(100,116,139,0.3)', animationDelay: `${index * 60}ms` }}
    >
      {cert.featured && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/20 via-transparent to-transparent pointer-events-none z-10" />
      )}

      {/* Top accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${style.bg.replace('/20', '/60')}`} />

      {/* Certificate Picture / Preview Banner */}
      <div
        onClick={() => onViewFile(cert)}
        className="relative w-full h-52 sm:h-56 bg-slate-950 overflow-hidden cursor-pointer group/pic border-b border-slate-800/80"
      >
        {previewImg ? (
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-3.5">
            <div className="relative max-h-full max-w-full rounded-md overflow-hidden shadow-xl shadow-black/70 border border-slate-700/60 bg-white/5">
              <img
                src={previewImg}
                alt={cert.title}
                loading="lazy"
                className="w-full h-full max-h-[185px] object-contain group-hover/pic:scale-105 transition-transform duration-500"
              />
            </div>
            {/* Quick hover view overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-0 group-hover/pic:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 backdrop-blur-md">
                <Eye className="w-3.5 h-3.5" />
                Click to View
              </span>
            </div>
          </div>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${style.bg} flex flex-col items-center justify-center gap-2`}>
            {isPdf ? (
              <FileText className={`w-10 h-10 ${style.text}`} />
            ) : (
              <Award className={`w-10 h-10 ${style.text}`} />
            )}
            <span className="text-xs text-slate-400 font-medium">Certificate Document</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.border} ${style.text} bg-slate-900/90 backdrop-blur-md shadow-md`}>
            {cert.category || 'General'}
          </span>
        </div>

        {/* Featured Star Badge */}
        {cert.featured && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
            <Star className="w-3 h-3 fill-current" />
            <span>Featured</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-white text-base leading-snug mb-1.5 group-hover:text-amber-200 transition-colors duration-300">
            {cert.title}
          </h3>

          <p className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            {cert.issuer}
          </p>

          {cert.description && (
            <p className="text-xs text-slate-400/90 mb-4 leading-relaxed line-clamp-2">
              {cert.description}
            </p>
          )}

          <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
            {issuedFormatted && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                {issuedFormatted}
              </span>
            )}
            {expiryFormatted && <span className="text-slate-600">·</span>}
            {expiryFormatted && (
              <span className="text-amber-400/80">Expires {expiryFormatted}</span>
            )}
          </div>

          {cert.credentialId && (
            <div className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 mb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
                Credential ID
              </p>
              <p className="text-xs text-slate-300 font-mono truncate">{cert.credentialId}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {cert.fileUrl && (
            <button
              onClick={() => onViewFile(cert)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border ${style.border} ${style.text} bg-gradient-to-r ${style.bg} hover:opacity-80 transition-all duration-200 group/btn`}
            >
              {isPdf ? (
                <><FileText className="w-3.5 h-3.5 shrink-0" /><span>View PDF</span></>
              ) : (
                <><Eye className="w-3.5 h-3.5 shrink-0" /><span>View Certificate</span></>
              )}
              <ChevronRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 -translate-x-1 group-hover/btn:translate-x-0 transition-all" />
            </button>
          )}

          {cert.credentialUrl && (
            <a
              href={cert.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Verify Credential"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800/60 border border-slate-700 hover:text-white hover:border-slate-600 transition-all duration-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Verify</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Section ──────────────────────────────────────────────────────────

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewingCert, setViewingCert] = useState(null); // cert object being viewed

  useEffect(() => {
    const unsub = subscribeToPublishedCertificates((certs) => {
      setCertificates(certs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleViewFile = useCallback((cert) => {
    setViewingCert(cert);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewingCert(null);
  }, []);

  const existingCategories = [
    'All',
    ...Array.from(new Set(certificates.map((c) => c.category || 'General'))),
  ];

  const filtered =
    activeFilter === 'All'
      ? certificates
      : certificates.filter((c) => (c.category || 'General') === activeFilter);

  const featuredCerts = filtered.filter((c) => c.featured);
  const regularCerts = filtered.filter((c) => !c.featured);

  if (loading) {
    return (
      <section id="certificates" className="py-24 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      </section>
    );
  }

  if (!loading && certificates.length === 0) return null;

  return (
    <>
      {/* PDF / Image Viewer Modal */}
      {viewingCert && (
        viewingCert.fileType === 'pdf' ? (
          <PdfViewerModal cert={viewingCert} onClose={handleCloseViewer} />
        ) : (
          <ImageViewerModal cert={viewingCert} onClose={handleCloseViewer} />
        )
      )}

      <section id="certificates" className="py-24 px-6 sm:px-10 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-32 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-4">
                <Award className="w-3.5 h-3.5" />
                Certifications
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Credentials &amp;{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  Certifications
                </span>
              </h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-xl">
                Professional certifications and industry credentials earned by Ramesh Jahan Jayalath validating expertise in software engineering, development, and IT solutions.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold self-start sm:self-auto">
              {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Category filter tabs */}
          {existingCategories.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {existingCategories.map((cat) => {
                const isActive = activeFilter === cat;
                const style = cat === 'All' ? null : getStyle(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                      isActive
                        ? cat === 'All'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/30'
                          : `bg-gradient-to-r ${style.bg} ${style.border} ${style.text} shadow-md`
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Featured */}
          {featuredCerts.length > 0 && (
            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400/70 mb-4 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" fill="currentColor" />
                Featured
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredCerts.map((cert, i) => (
                  <CertificateCard key={cert.id} cert={cert} index={i} onViewFile={handleViewFile} />
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          {regularCerts.length > 0 && (
            <div>
              {featuredCerts.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  All Certificates
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {regularCerts.map((cert, i) => (
                  <CertificateCard key={cert.id} cert={cert} index={i} onViewFile={handleViewFile} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500 text-sm">
              No certificates in this category yet.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
