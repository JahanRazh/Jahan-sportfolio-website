'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Check,
  FileText,
  Image as ImageIcon,
  Award,
  ExternalLink,
  FileCheck,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { uploadCertificateFile } from '../../lib/certificateStorage';
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

export default function CertificateFormModal({
  isOpen,
  onClose,
  onSave,
  initialCertificate = null,
}) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const isEditing = Boolean(initialCertificate && initialCertificate.id);

  const defaultForm = {
    title: '',
    issuer: '',
    issuedDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
    category: 'General',
    fileUrl: '',
    filePath: '',
    fileType: 'image',
    thumbnailUrl: '',
    featured: false,
    published: true,
    order: 1,
  };

  const [formData, setFormData] = useState(defaultForm);
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (initialCertificate) {
      setFormData({
        title: initialCertificate.title || '',
        issuer: initialCertificate.issuer || '',
        issuedDate: initialCertificate.issuedDate || '',
        expiryDate: initialCertificate.expiryDate || '',
        credentialId: initialCertificate.credentialId || '',
        credentialUrl: initialCertificate.credentialUrl || '',
        description: initialCertificate.description || '',
        category: initialCertificate.category || 'General',
        fileUrl: initialCertificate.fileUrl || '',
        filePath: initialCertificate.filePath || '',
        fileType: initialCertificate.fileType || 'image',
        thumbnailUrl: initialCertificate.thumbnailUrl || '',
        featured: Boolean(initialCertificate.featured),
        published: initialCertificate.published !== undefined ? Boolean(initialCertificate.published) : true,
        order: initialCertificate.order !== undefined ? Number(initialCertificate.order) : 1,
      });
      setFilePreview(initialCertificate.thumbnailUrl || initialCertificate.fileUrl || '');
      if (initialCertificate.fileUrl && !initialCertificate.filePath && !initialCertificate.fileUrl.includes('cloudinary.com')) {
        setInputMode('url');
      } else {
        setInputMode('file');
      }
    } else {
      setFormData(defaultForm);
      setFilePreview('');
      setInputMode('file');
    }
    setSelectedFile(null);
    setIsDragging(false);
    setUploadProgress(0);
    setIsExtracting(false);
  }, [initialCertificate, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    const isPdf = url.toLowerCase().includes('.pdf');
    setFormData((prev) => ({
      ...prev,
      fileUrl: url,
      fileType: isPdf ? 'pdf' : prev.fileType,
      thumbnailUrl: isPdf ? (prev.thumbnailUrl || url.replace(/\.pdf$/i, '.jpg')) : url,
    }));
  };

  const extractDetailsWithAi = async (fileOrUrl) => {
    const target = fileOrUrl || selectedFile || (inputMode === 'url' ? formData.fileUrl : null);
    if (!target) {
      addToast('Please upload or provide a certificate first', 'error');
      return;
    }

    setIsExtracting(true);
    addToast('✨ AI is analyzing your certificate document...', 'info');

    try {
      let response;
      if (target instanceof File) {
        const payload = new FormData();
        payload.append('file', target);
        response = await fetch('/api/extract-certificate', {
          method: 'POST',
          body: payload,
        });
      } else if (typeof target === 'string' && target.trim()) {
        response = await fetch('/api/extract-certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: target.trim() }),
        });
      }

      if (!response) {
        throw new Error('No input provided to analyze');
      }

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const {
          title,
          issuer,
          category,
          issuedDate,
          expiryDate,
          credentialId,
          credentialUrl,
          description,
        } = result.data;

        setFormData((prev) => ({
          ...prev,
          title: title || prev.title,
          issuer: issuer || prev.issuer,
          category: category || prev.category,
          issuedDate: issuedDate || prev.issuedDate,
          expiryDate: expiryDate || prev.expiryDate,
          credentialId: credentialId || prev.credentialId,
          credentialUrl: credentialUrl || prev.credentialUrl,
          description: description || prev.description,
        }));

        addToast('✨ Certificate details auto-filled with AI!', 'success');
      } else {
        console.warn('AI extraction returned error:', result.error);
        addToast(result.error || 'Could not auto-detect certificate details', 'warning');
      }
    } catch (err) {
      console.error('AI extraction error:', err);
      addToast('AI auto-fill failed: ' + err.message, 'warning');
    } finally {
      setIsExtracting(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    const isImage = file.type?.startsWith('image/');

    if (!isPdf && !isImage) {
      addToast('Please select a valid certificate document (PDF, JPG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds Cloudinary 10MB limit. Please choose a smaller file.', 'error');
      return;
    }

    setSelectedFile(file);
    setFormData((prev) => ({ ...prev, fileType: isPdf ? 'pdf' : 'image' }));

    if (isPdf) {
      setFilePreview('pdf');
    } else {
      setFilePreview(URL.createObjectURL(file));
    }

    // Automatically trigger AI extraction to autofill the form
    extractDetailsWithAi(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setFilePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData((prev) => ({
      ...prev,
      fileUrl: '',
      filePath: '',
      fileType: 'image',
      thumbnailUrl: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('Certificate title is required', 'error');
      return;
    }
    if (!formData.issuer.trim()) {
      addToast('Issuing organization is required', 'error');
      return;
    }

    setIsSaving(true);

    try {
      let finalFileUrl = formData.fileUrl;
      let finalFilePath = formData.filePath;
      let finalFileType = formData.fileType;
      let finalThumbnailUrl = formData.thumbnailUrl;

      if (inputMode === 'file' && selectedFile) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadCertificateFile(selectedFile, (pct) => {
            setUploadProgress(pct);
          });
          finalFileUrl = uploadResult.downloadUrl;
          finalFilePath = uploadResult.storagePath;
          const isPdf = selectedFile.type === 'application/pdf';
          finalFileType = isPdf ? 'pdf' : 'image';
          finalThumbnailUrl = uploadResult.thumbnailUrl || (isPdf ? finalFileUrl.replace(/\.pdf$/i, '.jpg') : finalFileUrl);
          addToast('File uploaded to Cloudinary!', 'success');
        } catch (uploadErr) {
          console.warn('Certificate upload failed:', uploadErr);
          addToast('File upload failed. Saving without file.', 'warning');
        } finally {
          setIsUploading(false);
        }
      } else if (inputMode === 'url') {
        finalFileUrl = (formData.fileUrl || '').trim();
        finalFilePath = formData.filePath || '';
        const isPdf = finalFileUrl.toLowerCase().includes('.pdf') || formData.fileType === 'pdf';
        finalFileType = isPdf ? 'pdf' : 'image';
        finalThumbnailUrl = formData.thumbnailUrl?.trim() || (isPdf ? finalFileUrl.replace(/\.pdf$/i, '.jpg') : finalFileUrl);
      }

      const certToSave = {
        ...formData,
        fileUrl: finalFileUrl,
        filePath: finalFilePath,
        fileType: finalFileType,
        thumbnailUrl: finalThumbnailUrl,
        order: Number(formData.order) || 1,
      };

      await onSave(certToSave);
      onClose();
    } catch (error) {
      console.error('Error saving certificate:', error);
      addToast(error.message || 'Failed to save certificate', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isPdfFile = formData.fileType === 'pdf' || filePreview === 'pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {isEditing ? 'Edit Certificate' : 'Add Certificate'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing ? 'Update certificate details' : 'Upload a new certificate or credential'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* AI Extraction Status Banner */}
          {isExtracting && (
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border border-amber-500/40 text-amber-200 shadow-xl shadow-amber-500/10 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Gemini AI is reading your certificate...</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Auto-Filling
                  </span>
                </p>
                <p className="text-xs text-amber-300/80 mt-0.5 truncate">
                  Extracting Title, Issuing Organization, Category, Dates & Credential IDs
                </p>
              </div>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Certificate Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. AWS Certified Solutions Architect"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Issuer */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Issuing Organization <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="issuer"
              required
              value={formData.issuer}
              onChange={handleInputChange}
              placeholder="e.g. Amazon Web Services, Google, Coursera"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                name="issuedDate"
                value={formData.issuedDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Expiry Date <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Credential ID & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Credential ID
              </label>
              <input
                type="text"
                name="credentialId"
                value={formData.credentialId}
                onChange={handleInputChange}
                placeholder="e.g. ABC-XYZ-123456"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Verify / Credential URL
              </label>
              <div className="relative">
                <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  name="credentialUrl"
                  value={formData.credentialUrl}
                  onChange={handleInputChange}
                  placeholder="https://verify.example.com/..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Description <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of what this certificate covers..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Certificate File / Document Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Certificate Document / Picture
              </label>
              <span className="text-xs text-slate-400">PDF or Image · Max 10MB</span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 w-full sm:w-fit gap-1">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  inputMode === 'file'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File (Drag & Drop)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  inputMode === 'url'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Direct File URL</span>
              </button>
            </div>

            {/* Mode 1: Drag & Drop File Upload */}
            {inputMode === 'file' && (
              <div>
                {/* Hidden native input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!selectedFile && !formData.fileUrl ? (
                  /* Empty Drag & Drop Dropzone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 group ${
                      isDragging
                        ? 'border-amber-400 bg-amber-500/15 shadow-xl shadow-amber-500/20 scale-[1.01]'
                        : 'border-slate-700/80 hover:border-amber-500/60 bg-slate-800/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                          isDragging
                            ? 'bg-amber-500/25 text-amber-300 scale-110'
                            : 'bg-amber-500/10 text-amber-400 group-hover:scale-105 border border-amber-500/20'
                        }`}
                      >
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {isDragging ? (
                            <span className="text-amber-300 font-bold">Drop certificate file here!</span>
                          ) : (
                            <>
                              Drag & drop certificate here, or{' '}
                              <span className="text-amber-400 underline decoration-amber-400/50 underline-offset-2">
                                browse
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Supports PDF document (auto-rendered preview) or Image (JPG, PNG, WEBP)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Selected / Active File Preview & Manage Card */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`p-4 rounded-2xl bg-slate-900 border transition-all ${
                      isDragging ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20' : 'border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Visual Preview Box */}
                      <div className="relative w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
                        {filePreview && filePreview !== 'pdf' ? (
                          <img
                            src={filePreview}
                            alt="Certificate Preview"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : isPdfFile ? (
                          <div className="flex flex-col items-center justify-center text-amber-400 gap-1.5 p-3 text-center">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-amber-400" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                              PDF Document
                            </span>
                            <span className="text-[10px] text-slate-400">Page 1 preview will be generated</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                            <ImageIcon className="w-6 h-6" />
                            <span>No preview</span>
                          </div>
                        )}
                      </div>

                      {/* Info and Actions */}
                      <div className="flex-1 w-full space-y-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isPdfFile
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}
                              >
                                {isPdfFile ? 'PDF' : 'IMAGE'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {selectedFile
                                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                                  : 'Cloudinary Asset'}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-white truncate mt-1">
                              {selectedFile
                                ? selectedFile.name
                                : formData.title
                                ? `${formData.title}.${formData.fileType === 'pdf' ? 'pdf' : 'jpg'}`
                                : 'certificate_file'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            disabled={isExtracting}
                            onClick={() => extractDetailsWithAi(selectedFile || formData.fileUrl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                            title="Auto-fill form details from this document using Gemini AI"
                          >
                            {isExtracting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span>{isExtracting ? 'Analyzing...' : 'Auto-Fill with AI'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change File</span>
                          </button>

                          {formData.fileUrl && (
                            <a
                              href={formData.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Current File</span>
                            </a>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400">
                          You can also drag and drop a new file directly on this card to replace it.
                        </p>
                      </div>
                    </div>

                    {isUploading && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Uploading to Cloudinary...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Direct File URL */}
            {inputMode === 'url' && (
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Direct Document or Image URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      name="fileUrl"
                      value={formData.fileUrl}
                      onChange={handleUrlChange}
                      placeholder="https://example.com/my-certificate.pdf or https://.../image.jpg"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Paste a direct public link to a PDF document or hosted image.
                  </p>
                </div>

                {/* Document Type Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Document Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, fileType: 'pdf' }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                        formData.fileType === 'pdf'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span>PDF Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, fileType: 'image' }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                        formData.fileType === 'image'
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      <span>Image File</span>
                    </button>
                  </div>
                </div>

                {/* Custom Thumbnail URL if PDF */}
                {formData.fileType === 'pdf' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Custom Thumbnail / Cover Image URL <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      name="thumbnailUrl"
                      value={formData.thumbnailUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/cover-preview.jpg"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      If left empty, a page 1 preview or document badge will be displayed automatically.
                    </p>
                  </div>
                )}

                {/* Direct Link Preview Box */}
                {formData.fileUrl && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {formData.fileType === 'image' ? (
                        <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 shrink-0 flex items-center justify-center">
                          <img
                            src={formData.fileUrl}
                            alt="URL Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-rose-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-sm">
                          {formData.fileUrl}
                        </p>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Direct URL connected
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={() => extractDetailsWithAi(formData.fileUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                        title="Auto-fill form details from this URL using Gemini AI"
                      >
                        {isExtracting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isExtracting ? 'Analyzing...' : 'Auto-Fill with AI'}</span>
                      </button>

                      <a
                        href={formData.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Test URL in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Display Order
              </label>
              <input
                type="number"
                name="order"
                min={1}
                value={formData.order}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div>
                <p className="text-xs font-bold text-white">Featured</p>
                <p className="text-[11px] text-slate-400">Highlight this certificate</p>
              </div>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div>
                <p className="text-xs font-bold text-white">Published</p>
                <p className="text-[11px] text-slate-400">Visible on portfolio</p>
              </div>
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition shadow-lg shadow-amber-500/30 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Add Certificate'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
