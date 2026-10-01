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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { subscribeToPublishedCertificates } from '../lib/firestore';
import { getDirectDownloadUrl, downloadPdfDirectly } from '../lib/downloadHelper';

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
  'Digital Badge':         { bg: 'from-amber-500/20 to-orange-500/20',  border: 'border-amber-500/30',   text: 'text-amber-300'   },
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
 * Resolves the visual preview image URL for a certificate.
 * For PDF certificates uploaded to Cloudinary, automatically targets the high-resolution JPG.
 */
function getCertificatePreviewUrl(cert) {
  if (cert.thumbnailUrl && !cert.thumbnailUrl.match(/\.pdf(\?.*)?$/i)) {
    return cert.thumbnailUrl;
  }
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

  return cert.thumbnailUrl || null;
}

/**
 * Returns an ultra high-resolution version of the certificate preview image
 */
function getHighResCertificateUrl(cert) {
  const base = getCertificatePreviewUrl(cert);
  if (!base) return cert.fileUrl || cert.thumbnailUrl;
  // If it's a Cloudinary upload URL, ensure high resolution and auto quality
  if (base.includes('/image/upload/') && !base.includes('/image/upload/w_') && !base.includes('/image/upload/q_')) {
    return base.replace('/image/upload/', '/image/upload/q_auto,f_auto,w_1800/');
  }
  return base;
}

// ─── Certificate Viewer Modal ──────────────────────────────────────────────

function CertificateViewerModal({ cert, onClose }) {
  const isPdf = cert.fileType === 'pdf';
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  const visualUrl = getHighResCertificateUrl(cert) || cert.fileUrl;
  const fileName = `${cert.title || 'Certificate'}.${isPdf ? 'pdf' : 'jpg'}`;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(Number((z + 0.25).toFixed(2)), 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-center items-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative flex flex-col w-full h-[92vh] max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md shrink-0">
          
          {/* Certificate Title & Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="w-4 h-4 text-amber-400" />
              ) : (
                <Award className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate leading-snug">{cert.title}</h3>
              <p className="text-slate-400 text-xs truncate flex items-center gap-1.5">
                <span>{cert.issuer}</span>
                {cert.category && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400/90">{cert.category}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Open in New Tab */}
            <a
              href={cert.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
              title={isPdf ? 'Open original PDF in a new tab' : 'Open full size in a new tab'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isPdf ? 'Open PDF' : 'New Tab'}</span>
            </a>

            {/* Direct Download */}
            <a
              href={getDirectDownloadUrl(cert.fileUrl, fileName)}
              download={fileName}
              onClick={(e) => {
                e.preventDefault();
                downloadPdfDirectly(cert.fileUrl, fileName);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
              title="Directly download file to device"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col">
          <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center">
            {imgLoading && !imgError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 z-10">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-slate-400 text-xs">Loading certificate...</p>
              </div>
            )}

            {imgError ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <FileText className="w-12 h-12 text-amber-400/80" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{cert.title}</p>
                  <p className="text-slate-400 text-xs">Document is ready to view or download.</p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Open PDF in New Tab
                  </a>
                  <button
                    onClick={() => downloadPdfDirectly(cert.fileUrl, fileName)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="transition-transform duration-200 ease-out max-w-full flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={visualUrl}
                  alt={cert.title}
                  onLoad={() => setImgLoading(false)}
                  onError={() => {
                    setImgLoading(false);
                    setImgError(true);
                  }}
                  className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-white/5"
                />
              </div>
            )}

            {/* Floating Zoom Controls */}
            {!imgError && (
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-slate-300 text-xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.75}
                  className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-[11px] font-mono hover:text-white transition"
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2.5}
                  className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            {cert.issuedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {formatDate(cert.issuedDate)}
              </span>
            )}
            {cert.credentialId && (
              <span className="hidden sm:inline-block font-mono text-[11px] text-slate-500">
                ID: {cert.credentialId}
              </span>
            )}
          </div>
          {cert.credentialUrl && (
            <a
              href={cert.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition"
            >
              <span>Verify Credential</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Digital Badge Viewer Modal ────────────────────────────────────────────

function BadgeViewerModal({ badge, onClose }) {
  const [copied, setCopied] = useState(false);
  const badgeImg = badge.thumbnailUrl || badge.fileUrl;
  const issuedFormatted = formatDate(badge.issuedDate);
  const expiryFormatted = formatDate(badge.expiryDate);

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

  const handleCopyId = () => {
    if (!badge.credentialId) return;
    navigator.clipboard.writeText(badge.credentialId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-center items-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative flex flex-col w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/95 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Digital Badge Assertion
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge Hero Section */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
          {/* Subtle Ambient Light */}
          <div className="absolute top-1/4 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Badge Icon Frame */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-slate-900/90 border border-amber-500/30 p-4 flex items-center justify-center shadow-2xl shadow-amber-500/10 mb-5 group">
            {badgeImg ? (
              <img
                src={badgeImg}
                alt={badge.title}
                className="w-full h-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <Award className="w-20 h-20 text-amber-400" />
            )}
          </div>

          {/* Verified Badge Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Micro-Credential</span>
          </div>

          {/* Badge Title */}
          <h3 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2">
            {badge.title}
          </h3>

          {/* Issuer info */}
          <div className="flex items-center gap-2 text-sm text-amber-300 font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{badge.issuer}</span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
            {issuedFormatted && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Issued {issuedFormatted}
              </span>
            )}
            {expiryFormatted && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400/80">Expires {expiryFormatted}</span>
              </>
            )}
          </div>

          {/* Description */}
          {badge.description && (
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-md bg-slate-900/70 p-4 rounded-xl border border-slate-800 text-left mb-4">
              {badge.description}
            </p>
          )}

          {/* Credential ID */}
          {badge.credentialId && (
            <div className="w-full max-w-md flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 mb-4 text-left">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Assertion / Credential ID
                </p>
                <p className="text-xs font-mono text-slate-200 truncate">
                  {badge.credentialId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition shrink-0"
                title="Copy Credential ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-2.5">
            {badge.credentialUrl && (
              <a
                href={badge.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify on Official Registry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {badgeImg && (
              <a
                href={badgeImg}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Badge Image</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Digital Badge Card Component ──────────────────────────────────────────

function DigitalBadgeCard({ badge, index, onViewBadge }) {
  const badgeImg = badge.thumbnailUrl || badge.fileUrl;
  const issuedFormatted = formatDate(badge.issuedDate);

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950 p-6 flex flex-col justify-between hover:border-amber-500/50 dark:hover:border-amber-500/40 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-xl dark:hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Background glow behind badge icon */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors pointer-events-none" />

      {/* Top tag bar */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
          <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
          Digital Badge
        </span>
        {badge.featured && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </span>
        )}
      </div>

      {/* Badge Icon Display */}
      <div
        onClick={() => onViewBadge(badge)}
        className="relative my-3 flex flex-col items-center justify-center cursor-pointer group/icon"
      >
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 group-hover/icon:border-amber-500/40 shadow-inner transition-all duration-300">
          {badgeImg ? (
            <img
              src={badgeImg}
              alt={badge.title}
              loading="lazy"
              className="w-full h-full object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] group-hover/icon:scale-110 transition-transform duration-300"
            />
          ) : (
            <Award className="w-16 h-16 text-amber-500 dark:text-amber-400/80" />
          )}
        </div>
        <span className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 group-hover/icon:text-amber-600 dark:group-hover/icon:text-amber-300 font-medium flex items-center gap-1 transition">
          <Eye className="w-3 h-3" />
          Inspect badge
        </span>
      </div>

      {/* Title & Issuer */}
      <div className="relative z-10 text-center my-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-200 transition-colors line-clamp-2">
          {badge.title}
        </h3>
        <p className="text-xs text-amber-600 dark:text-amber-400/90 font-medium mt-1.5 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>{badge.issuer}</span>
        </p>

        {badge.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {badge.description}
          </p>
        )}

        {issuedFormatted && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-600" />
            <span>Issued {issuedFormatted}</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
        <button
          onClick={() => onViewBadge(badge)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
        >
          <Eye className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Details</span>
        </button>

        {badge.credentialUrl && (
          <a
            href={badge.credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition"
          >
            <span>Verify</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Traditional Certificate Card ──────────────────────────────────────────

function CertificateCard({ cert, index, onViewFile }) {
  const style = getStyle(cert.category);
  const issuedFormatted = formatDate(cert.issuedDate);
  const expiryFormatted = formatDate(cert.expiryDate);
  const isPdf = cert.fileType === 'pdf';
  const previewImg = getCertificatePreviewUrl(cert);

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-1 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-2xl dark:hover:shadow-amber-900/20 flex flex-col justify-between"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {cert.featured && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/10 dark:from-amber-500/20 via-transparent to-transparent pointer-events-none z-10" />
      )}

      {/* Top accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${style.bg.replace('/20', '/60')}`} />

      {/* Certificate Picture / Preview Banner */}
      <div
        onClick={() => onViewFile(cert)}
        className="relative w-full h-52 sm:h-56 bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer group/pic border-b border-slate-200 dark:border-slate-800/80"
      >
        {previewImg ? (
          <div className="relative w-full h-full bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-3.5">
            <div className="relative max-h-full max-w-full rounded-md overflow-hidden shadow-md dark:shadow-xl dark:shadow-black/70 border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-white/5">
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
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certificate Document</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.border} ${style.text} bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-md`}>
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
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-200 transition-colors duration-300">
            {cert.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400/80 shrink-0" />
            {cert.issuer}
          </p>

          {cert.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400/90 mb-4 leading-relaxed line-clamp-2">
              {cert.description}
            </p>
          )}

          <div className="flex items-center gap-3 mb-4 text-xs text-slate-500 dark:text-slate-400">
            {issuedFormatted && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                {issuedFormatted}
              </span>
            )}
            {expiryFormatted && <span className="text-slate-400 dark:text-slate-600">·</span>}
            {expiryFormatted && (
              <span className="text-amber-600 dark:text-amber-400/80">Expires {expiryFormatted}</span>
            )}
          </div>

          {cert.credentialId && (
            <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-4">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
                Credential ID
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate">{cert.credentialId}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {cert.fileUrl && (
            <>
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

              <a
                href={getDirectDownloadUrl(cert.fileUrl, `${cert.title || 'Certificate'}.${isPdf ? 'pdf' : 'jpg'}`)}
                download={`${cert.title || 'Certificate'}.${isPdf ? 'pdf' : 'jpg'}`}
                onClick={(e) => {
                  e.preventDefault();
                  downloadPdfDirectly(cert.fileUrl, `${cert.title || 'Certificate'}.${isPdf ? 'pdf' : 'jpg'}`);
                }}
                title={isPdf ? 'Download PDF directly' : 'Download certificate directly'}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-slate-800/80 dark:hover:bg-amber-500/20 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </>
          )}

          {cert.credentialUrl && (
            <a
              href={cert.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Verify Credential"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
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
  const [viewingBadge, setViewingBadge] = useState(null); // badge object being viewed

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

  const handleCloseBadgeViewer = useCallback(() => {
    setViewingBadge(null);
  }, []);

  // Separate Digital Badges and Traditional Certificates
  // An item is a badge ONLY if explicitly marked isBadge: true, or category is Digital Badge.
  // When an admin chooses Certificate (isBadge: false) or uploads a PDF document, it stays in Certificates!
  const isBadgeItem = (c) => {
    if (c.isBadge === true) return true;
    if (c.isBadge === false) return false;
    if (c.category === 'Digital Badge') return true;
    if (c.fileType === 'pdf' || c.fileUrl?.match(/\.pdf($|\?)/i)) return false;
    return Boolean(
      c.credentialUrl && (c.credentialUrl.includes('badges.parchment.com') || c.credentialUrl.includes('badgr.com'))
    );
  };

  const allBadges = certificates.filter(isBadgeItem);
  const allCertificates = certificates.filter((c) => !isBadgeItem(c));

  const existingCategories = [
    'All',
    ...Array.from(new Set(allCertificates.map((c) => c.category || 'General'))),
  ];

  const filteredCertificates =
    activeFilter === 'All'
      ? allCertificates
      : allCertificates.filter((c) => (c.category || 'General') === activeFilter);

  const featuredCerts = filteredCertificates.filter((c) => c.featured);
  const regularCerts = filteredCertificates.filter((c) => !c.featured);

  if (loading) {
    return (
      <section id="certificates" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      </section>
    );
  }

  if (!loading && certificates.length === 0) return null;

  return (
    <>
      {/* Certificate Viewer Modal */}
      {viewingCert && (
        <CertificateViewerModal cert={viewingCert} onClose={handleCloseViewer} />
      )}

      {/* Digital Badge Viewer Modal */}
      {viewingBadge && (
        <BadgeViewerModal badge={viewingBadge} onClose={handleCloseBadgeViewer} />
      )}

      <section id="certificates" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-32 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-72 sm:w-80 h-72 sm:h-80 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4">
                <Award className="w-3.5 h-3.5" />
                Certifications &amp; Credentials
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                Credentials &amp;{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400">
                  Certifications
                </span>
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 text-xs sm:text-base max-w-xl">
                Professional certifications and industry credentials earned by Ramesh Jahan Jayalath validating expertise in software engineering, development, and IT solutions.
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {allCertificates.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  {allCertificates.length} Certificate{allCertificates.length !== 1 ? 's' : ''}
                </span>
              )}
              {allBadges.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  {allBadges.length} Badge{allBadges.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Category filter tabs for certificates */}
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
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/30'
                          : `bg-gradient-to-r ${style.bg} ${style.border} ${style.text} shadow-md font-bold`
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-300 shadow-sm'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Featured Certificates */}
          {featuredCerts.length > 0 && (
            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400/70 mb-4 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                Featured
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredCerts.map((cert, i) => (
                  <CertificateCard key={cert.id} cert={cert} index={i} onViewFile={handleViewFile} />
                ))}
              </div>
            </div>
          )}

          {/* Regular Certificates */}
          {regularCerts.length > 0 && (
            <div>
              {featuredCerts.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
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

          {filteredCertificates.length === 0 && allCertificates.length > 0 && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
              No certificates in this category yet.
            </div>
          )}

          {/* ─── DIGITAL BADGES SECTION BELOW CERTIFICATES ─────────────── */}
          {allBadges.length > 0 && (
            <div id="digital-badges" className="mt-20 pt-16 border-t border-slate-200 dark:border-slate-800/80 relative">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Verified Micro-Credentials
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                    Digital{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-400 dark:via-orange-400 dark:to-amber-200">
                      Badges
                    </span>
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl">
                    Verifiable Open Badges and industry micro-credentials recognizing specialized technical achievements and hands-on skill proficiency.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    {allBadges.length} Verified Badge{allBadges.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allBadges.map((badge, idx) => (
                  <DigitalBadgeCard
                    key={badge.id || idx}
                    badge={badge}
                    index={idx}
                    onViewBadge={setViewingBadge}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

