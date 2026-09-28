'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderUp,
  Check,
  Award,
  Layers,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { uploadCertificateFile } from '../../lib/certificateStorage';
import { createCertificate } from '../../lib/firestore';
import { useToast } from '../Toast';

const CATEGORIES = [
  'General',
  'Web Development',
  'Mobile Development',
  'Cloud & DevOps',
  'AI / Machine Learning',
  'Cybersecurity',
  'UI/UX Design',
  'Data Science',
  'Database',
  'Other',
];

const KNOWN_ISSUERS = [
  { match: /sliit/i, name: 'SLIIT' },
  { match: /aws|amazon/i, name: 'Amazon Web Services' },
  { match: /google/i, name: 'Google' },
  { match: /coursera/i, name: 'Coursera' },
  { match: /udemy/i, name: 'Udemy' },
  { match: /meta|facebook/i, name: 'Meta' },
  { match: /hackerrank/i, name: 'HackerRank' },
  { match: /linkedin/i, name: 'LinkedIn Learning' },
  { match: /microsoft/i, name: 'Microsoft' },
  { match: /oracle/i, name: 'Oracle' },
  { match: /cisco/i, name: 'Cisco' },
];

function sanitizeFilename(name) {
  if (!name) return 'Certificate';
  return name
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[_-]+/g, ' ') // replace underscores and hyphens with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function guessIssuerFromFilename(name) {
  if (!name) return '';
  for (const { match, name: issuerName } of KNOWN_ISSUERS) {
    if (match.test(name)) return issuerName;
  }
  return '';
}

export default function BulkCertificateUploadModal({
  isOpen,
  onClose,
  onBatchSaved,
}) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const cancelProcessingRef = useRef(false);

  const [filesQueue, setFilesQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // Settings
  const [autoSaveDirectly, setAutoSaveDirectly] = useState(true);
  const [defaultCategory, setDefaultCategory] = useState('auto'); // 'auto' or category string
  const [markAsFeatured, setMarkAsFeatured] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);

  if (!isOpen) return null;

  // Add files to queue
  const handleAddFiles = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    const acceptedList = [];
    for (const file of Array.from(newFiles)) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImg = file.type.startsWith('image/');

      if (!isPdf && !isImg) {
        addToast(`Skipped "${file.name}": Only PDFs and images are supported.`, 'warning');
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        addToast(`Skipped "${file.name}": Exceeds 15MB limit.`, 'warning');
        continue;
      }

      // Create unique queue entry
      const initialGuessTitle = sanitizeFilename(file.name);
      const initialGuessIssuer = guessIssuerFromFilename(file.name);

      acceptedList.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        type: isPdf ? 'pdf' : 'image',
        preview: isPdf ? 'pdf' : URL.createObjectURL(file),
        status: 'queued', // 'queued' | 'uploading' | 'extracting' | 'ready' | 'saved' | 'error'
        uploadProgress: 0,
        errorMessage: '',
        // Data fields (pre-filled with guess or AI)
        title: initialGuessTitle,
        issuer: initialGuessIssuer,
        category: defaultCategory === 'auto' ? 'General' : defaultCategory,
        issuedDate: '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
        description: '',
        fileUrl: '',
        filePath: '',
        thumbnailUrl: '',
        savedDocId: null,
      });
    }

    if (acceptedList.length > 0) {
      setFilesQueue((prev) => [...prev, ...acceptedList]);
      addToast(`Added ${acceptedList.length} certificate${acceptedList.length > 1 ? 's' : ''} to queue.`, 'info');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveQueueItem = (itemId) => {
    setFilesQueue((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleUpdateItemField = (itemId, field, value) => {
    setFilesQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  // Start Bulk Processing Workflow
  const handleStartProcessing = async () => {
    const uncompleted = filesQueue.filter(
      (item) => item.status === 'queued' || item.status === 'error'
    );

    if (uncompleted.length === 0) {
      addToast('No certificates in queue to process.', 'warning');
      return;
    }

    setIsProcessing(true);
    cancelProcessingRef.current = false;

    let processedCount = 0;
    const totalToProcess = uncompleted.length;

    for (let i = 0; i < filesQueue.length; i++) {
      if (cancelProcessingRef.current) {
        addToast('Processing stopped by user.', 'info');
        break;
      }

      const item = filesQueue[i];
      if (item.status === 'saved' || (item.status === 'ready' && !autoSaveDirectly)) {
        continue;
      }

      setCurrentIndex(i);

      try {
        // Step 1: Upload to Cloudinary if not already uploaded
        let uploadedUrl = item.fileUrl;
        let storagePath = item.filePath;
        let thumbUrl = item.thumbnailUrl;

        if (!uploadedUrl) {
          setFilesQueue((prev) =>
            prev.map((it, idx) =>
              idx === i ? { ...it, status: 'uploading', uploadProgress: 10 } : it
            )
          );

          const uploadResult = await uploadCertificateFile(item.file, (percent) => {
            setFilesQueue((prev) =>
              prev.map((it, idx) =>
                idx === i ? { ...it, uploadProgress: percent } : it
              )
            );
          });

          uploadedUrl = uploadResult.downloadUrl;
          storagePath = uploadResult.storagePath;
          thumbUrl = uploadResult.thumbnailUrl || uploadResult.downloadUrl;

          setFilesQueue((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    fileUrl: uploadedUrl,
                    filePath: storagePath,
                    thumbnailUrl: thumbUrl,
                    uploadProgress: 100,
                  }
                : it
            )
          );
        }

        if (cancelProcessingRef.current) break;

        // Step 2: AI Auto-fill Extraction
        setFilesQueue((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'extracting' } : it))
        );

        let aiData = null;
        try {
          // Send to Gemini AI endpoint
          const payload = new FormData();
          payload.append('file', item.file);

          const extractRes = await fetch('/api/extract-certificate', {
            method: 'POST',
            body: payload,
          });

          if (extractRes.ok) {
            const parsed = await extractRes.json();
            if (parsed.success && parsed.data) {
              aiData = parsed.data;
            }
          }
        } catch (aiErr) {
          console.warn('AI extraction warning for file:', item.name, aiErr);
        }

        // Merge AI data with fallback
        const finalTitle =
          aiData?.title?.trim() || item.title || sanitizeFilename(item.name);
        const finalIssuer =
          aiData?.issuer?.trim() || item.issuer || guessIssuerFromFilename(item.name) || 'Self';
        const finalCategory =
          defaultCategory !== 'auto'
            ? defaultCategory
            : aiData?.category || item.category || 'General';
        const finalIssuedDate = aiData?.issuedDate || item.issuedDate || '';
        const finalExpiryDate = aiData?.expiryDate || item.expiryDate || '';
        const finalCredentialId = aiData?.credentialId || item.credentialId || '';
        const finalCredentialUrl = aiData?.credentialUrl || item.credentialUrl || '';
        const finalDescription = aiData?.description || item.description || '';

        // Step 3: Direct Auto-Save to Firestore if mode is enabled
        let savedDoc = null;
        if (autoSaveDirectly) {
          setFilesQueue((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: 'saving' } : it))
          );

          const certificatePayload = {
            title: finalTitle,
            issuer: finalIssuer,
            category: finalCategory,
            issuedDate: finalIssuedDate,
            expiryDate: finalExpiryDate,
            credentialId: finalCredentialId,
            credentialUrl: finalCredentialUrl,
            description: finalDescription,
            fileUrl: uploadedUrl,
            filePath: storagePath,
            fileType: item.type,
            thumbnailUrl: thumbUrl,
            featured: markAsFeatured,
            published: publishImmediately,
            order: i + 1,
          };

          savedDoc = await createCertificate(certificatePayload);
        }

        // Update item in state
        setFilesQueue((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: autoSaveDirectly ? 'saved' : 'ready',
                  title: finalTitle,
                  issuer: finalIssuer,
                  category: finalCategory,
                  issuedDate: finalIssuedDate,
                  expiryDate: finalExpiryDate,
                  credentialId: finalCredentialId,
                  credentialUrl: finalCredentialUrl,
                  description: finalDescription,
                  savedDocId: savedDoc?.id || null,
                }
              : it
          )
        );

        processedCount++;
        setOverallProgress(Math.round((processedCount / totalToProcess) * 100));

        // Subtle pacing delay between files to avoid API rate bursts
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        console.error('Error processing certificate item:', item.name, err);
        setFilesQueue((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'error',
                  errorMessage: err.message || 'Failed to process file',
                }
              : it
          )
        );
      }
    }

    setIsProcessing(false);
    setCurrentIndex(-1);

    const savedTotal = filesQueue.filter((it) => it.status === 'saved').length + (autoSaveDirectly ? processedCount : 0);

    if (autoSaveDirectly) {
      addToast(`🎉 All certificates successfully uploaded, auto-filled with AI, and saved live!`, 'success');
      if (onBatchSaved) onBatchSaved();
    } else {
      addToast(`✨ Auto-fill complete! Review and click "Save All to Portfolio".`, 'info');
    }
  };

  // Save all items that are in 'ready' state (for review mode)
  const handleSaveAllReady = async () => {
    const readyItems = filesQueue.filter(
      (item) => item.status === 'ready' && !item.savedDocId
    );

    if (readyItems.length === 0) {
      addToast('No pending certificates to save.', 'warning');
      return;
    }

    setIsProcessing(true);
    let count = 0;

    for (let i = 0; i < filesQueue.length; i++) {
      const item = filesQueue[i];
      if (item.status === 'ready' && !item.savedDocId) {
        try {
          const doc = await createCertificate({
            title: item.title,
            issuer: item.issuer || 'Self',
            category: item.category || 'General',
            issuedDate: item.issuedDate || '',
            expiryDate: item.expiryDate || '',
            credentialId: item.credentialId || '',
            credentialUrl: item.credentialUrl || '',
            description: item.description || '',
            fileUrl: item.fileUrl,
            filePath: item.filePath,
            fileType: item.type,
            thumbnailUrl: item.thumbnailUrl,
            featured: markAsFeatured,
            published: publishImmediately,
            order: i + 1,
          });

          setFilesQueue((prev) =>
            prev.map((it, idx) =>
              idx === i ? { ...it, status: 'saved', savedDocId: doc.id } : it
            )
          );
          count++;
        } catch (err) {
          console.error('Save error:', err);
        }
      }
    }

    setIsProcessing(false);
    addToast(`Saved ${count} certificates to your live portfolio!`, 'success');
    if (onBatchSaved) onBatchSaved();
  };

  const handleStopProcessing = () => {
    cancelProcessingRef.current = true;
    setIsProcessing(false);
    setCurrentIndex(-1);
  };

  const completedCount = filesQueue.filter((it) => it.status === 'saved').length;
  const readyCount = filesQueue.filter((it) => it.status === 'ready').length;
  const queueCount = filesQueue.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  Bulk Upload &amp; AI Auto-Fill Certificates
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Drop multiple certificate documents (PDF/images). AI automatically extracts Title, Issuer, Category &amp; Date and saves directly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Settings & Automation Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
            {/* Direct Auto-Save Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSaveDirectly}
                onChange={(e) => setAutoSaveDirectly(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500 focus:ring-offset-slate-900"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Direct Auto-Save</span>
                <span className="text-[10px] text-slate-400 block">Save to Firestore as each finishes</span>
              </div>
            </label>

            {/* Category Override */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Category Setting
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                disabled={isProcessing}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="auto">✨ Auto-Detect with AI (Recommended)</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    Force: {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Publish Immediately */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Publish Live</span>
                <span className="text-[10px] text-slate-400 block">Visible on website immediately</span>
              </div>
            </label>

            {/* Mark as Featured */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={markAsFeatured}
                onChange={(e) => setMarkAsFeatured(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500 focus:ring-offset-slate-900"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Mark Featured</span>
                <span className="text-[10px] text-slate-400 block">Highlight on home portfolio</span>
              </div>
            </label>
          </div>

          {/* Multi-file Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FolderUp className="w-8 h-8" />
            </div>

            <div>
              <p className="text-sm font-bold text-white mb-1">
                Drag &amp; drop multiple certificates here, or{' '}
                <span className="text-amber-400 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400">
                Upload 5, 10, 20 or more files at once. Supports PDF, JPG, PNG, WEBP (Up to 15MB each).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                <FileText className="w-3.5 h-3.5 text-rose-400" /> PDF Documents
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> High-Res Images
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Automatic AI Extraction
              </span>
            </div>
          </div>

          {/* Queue Status & Overall Progress */}
          {filesQueue.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Batch Queue:</span>
                    <span className="text-amber-400 font-mono">{filesQueue.length} Files</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {completedCount} saved live · {readyCount} ready for review ·{' '}
                    {filesQueue.filter((it) => it.status === 'queued').length} pending
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all queued certificates?')) {
                        setFilesQueue([]);
                      }
                    }}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar when Active */}
              {isProcessing && (
                <div className="space-y-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing item {currentIndex + 1} of {filesQueue.length}...
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-indigo-500 transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {filesQueue.map((item, idx) => {
                  const isCurrent = isProcessing && currentIndex === idx;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.status === 'saved'
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : item.status === 'error'
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : isCurrent
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left: Thumbnail & Status */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
                            {item.preview === 'pdf' ? (
                              <div className="flex flex-col items-center justify-center text-rose-400">
                                <FileText className="w-6 h-6" />
                                <span className="text-[9px] font-bold">PDF</span>
                              </div>
                            ) : item.preview ? (
                              <img
                                src={item.preview}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-600" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white truncate">{item.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                {(item.size / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            </div>

                            {/* Status Tag */}
                            <div className="flex items-center gap-2 mt-1">
                              {item.status === 'queued' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                  Queued
                                </span>
                              )}
                              {item.status === 'uploading' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Uploading {item.uploadProgress}%
                                </span>
                              )}
                              {item.status === 'extracting' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  AI Reading Document...
                                </span>
                              )}
                              {item.status === 'saving' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Saving to Database...
                                </span>
                              )}
                              {item.status === 'saved' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  Saved Live to Portfolio
                                </span>
                              )}
                              {item.status === 'ready' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  AI Auto-Filled (Ready)
                                </span>
                              )}
                              {item.status === 'error' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  {item.errorMessage || 'Error'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Auto-filled / Editable Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-[2] w-full">
                          {/* Title */}
                          <div>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, 'title', e.target.value)
                              }
                              disabled={item.status === 'saved' || isProcessing}
                              placeholder="Certificate Title..."
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Issuer */}
                          <div>
                            <input
                              type="text"
                              value={item.issuer}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, 'issuer', e.target.value)
                              }
                              disabled={item.status === 'saved' || isProcessing}
                              placeholder="Issuer (e.g. AWS, SLIIT)..."
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Category */}
                          <div>
                            <select
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, 'category', e.target.value)
                              }
                              disabled={item.status === 'saved' || isProcessing}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="shrink-0 flex items-center gap-2">
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="View uploaded document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {item.status !== 'saved' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQueueItem(item.id)}
                              disabled={isProcessing}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Files are securely saved to Cloudinary and synced in real-time.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isProcessing ? (
              <button
                type="button"
                onClick={handleStopProcessing}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/30 transition"
              >
                Stop Processing
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
              >
                {completedCount > 0 ? 'Close & View Portfolio' : 'Cancel'}
              </button>
            )}

            {/* In Review mode with ready items */}
            {!autoSaveDirectly && readyCount > 0 && !isProcessing && (
              <button
                type="button"
                onClick={handleSaveAllReady}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
              >
                <Check className="w-4 h-4" />
                <span>Save All Approved ({readyCount})</span>
              </button>
            )}

            {/* Start Processing Button */}
            {filesQueue.some((it) => it.status === 'queued' || it.status === 'error') && !isProcessing && (
              <button
                type="button"
                onClick={handleStartProcessing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>
                  {autoSaveDirectly
                    ? `Start Bulk Upload & Auto-Save (${filesQueue.filter((it) => it.status === 'queued' || it.status === 'error').length})`
                    : `Start Auto-Fill Extraction (${filesQueue.filter((it) => it.status === 'queued' || it.status === 'error').length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
