'use client';

import React, { useState, useEffect } from 'react';
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    } else {
      setFormData(defaultForm);
      setFilePreview('');
    }
    setSelectedFile(null);
    setUploadProgress(0);
  }, [initialCertificate, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      addToast('File size exceeds 15MB limit', 'error');
      return;
    }

    const isPdf = file.type === 'application/pdf';
    setSelectedFile(file);
    setFormData((prev) => ({ ...prev, fileType: isPdf ? 'pdf' : 'image' }));

    if (isPdf) {
      setFilePreview('pdf');
    } else {
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview('');
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

      if (selectedFile) {
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

          {/* File Upload Section */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Certificate File (Cloudinary)
              </label>
              <span className="text-xs text-slate-400">JPG, PNG, WEBP or PDF · max 15 MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview Box */}
              <div className="relative w-36 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                {filePreview && filePreview !== 'pdf' ? (
                  <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : isPdfFile ? (
                  <div className="flex flex-col items-center justify-center text-amber-400 gap-1 text-xs">
                    <FileText className="w-8 h-8" />
                    <span className="font-semibold">PDF</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span>No file</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition">
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  {(filePreview || formData.fileUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Uploading to Cloudinary...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500">
                  Images will be displayed directly. PDFs will show a download/view button on the public portfolio.
                </p>
              </div>
            </div>
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
