'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Check,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  User,
  Sparkles,
  Layers,
  X,
  FileCheck,
  Camera,
  RotateCcw,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
  CheckCheck,
  Eye,
} from 'lucide-react';
import { useToast } from '../Toast';
import { updateProfile, INITIAL_PROFILE } from '../../lib/firestore';
import { compressImageIfNeeded } from '../../lib/imageCompressor';

export default function AboutCvManager({ profileData = null, onProfileUpdated }) {
  const { addToast } = useToast();

  const [formData, setFormData] = useState(INITIAL_PROFILE);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Photo state
  const [photoInputMode, setPhotoInputMode] = useState('file'); // 'file' | 'url'
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [previewStyle, setPreviewStyle] = useState('hero'); // 'hero' | 'circle'
  const [copiedPhotoUrl, setCopiedPhotoUrl] = useState(false);

  // CV state
  const [selectedCvFile, setSelectedCvFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  // Skill stack inputs
  const [newTagInputs, setNewTagInputs] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (profileData) {
      setFormData({
        title: profileData.title || INITIAL_PROFILE.title,
        bio: profileData.bio || INITIAL_PROFILE.bio,
        profileImageUrl: profileData.profileImageUrl || INITIAL_PROFILE.profileImageUrl,
        cvUrl: profileData.cvUrl || INITIAL_PROFILE.cvUrl,
        cvFileName: profileData.cvFileName || INITIAL_PROFILE.cvFileName,
        skillStacks: Array.isArray(profileData.skillStacks) && profileData.skillStacks.length > 0
          ? profileData.skillStacks
          : INITIAL_PROFILE.skillStacks,
      });
      if (profileData.profileImageUrl && !profileData.profileImageUrl.startsWith('/')) {
        setCustomPhotoUrl(profileData.profileImageUrl);
      }
    }
  }, [profileData]);

  // Photo handlers
  const handlePhotoFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPG, PNG, WEBP, GIF)', 'error');
      return;
    }

    // Automatically optimize images that are large so they fit Cloudinary's 10MB limit
    let processedFile = file;
    if (file.size > 2 * 1024 * 1024) {
      try {
        processedFile = await compressImageIfNeeded(file);
        if (processedFile.size < file.size) {
          const originalMb = (file.size / (1024 * 1024)).toFixed(1);
          const compressedMb = (processedFile.size / (1024 * 1024)).toFixed(1);
          addToast(`Image auto-optimized: ${originalMb}MB → ${compressedMb}MB`, 'info');
        }
      } catch (compressErr) {
        console.warn('Compression skipped:', compressErr);
      }
    }

    if (processedFile.size > 10 * 1024 * 1024) {
      addToast('Image size exceeds Cloudinary 10MB limit. Please choose a smaller image.', 'error');
      return;
    }

    setSelectedPhotoFile(processedFile);
    setPhotoPreview(URL.createObjectURL(processedFile));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    handlePhotoFileSelect(file);
  };

  const handlePhotoDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(true);
  };

  const handlePhotoDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    handlePhotoFileSelect(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhotoFile) return;

    setIsUploadingPhoto(true);
    setPhotoProgress(0);

    try {
      let fileToUpload = selectedPhotoFile;
      if (fileToUpload.size > 2 * 1024 * 1024) {
        fileToUpload = await compressImageIfNeeded(fileToUpload);
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', fileToUpload);
      uploadFormData.append('folder', 'portfolio-profile');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/cloudinary');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setPhotoProgress(percent);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.url) resolve(res);
              else reject(new Error(res.error || 'Upload failed'));
            } catch {
              reject(new Error('Invalid response from upload server'));
            }
          } else {
            let errorMsg = `Upload failed with status ${xhr.status}`;
            try {
              const errData = JSON.parse(xhr.responseText);
              if (errData.error) errorMsg = errData.error;
            } catch {}
            reject(new Error(errorMsg));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during photo upload'));
      });

      xhr.send(uploadFormData);
      const res = await uploadPromise;

      const updated = {
        ...formData,
        profileImageUrl: res.url,
      };
      setFormData(updated);

      setSelectedPhotoFile(null);
      setPhotoPreview('');
      setCustomPhotoUrl(res.url);

      // Auto-persist directly to Firestore so the update is immediate
      try {
        await updateProfile(updated);
        if (onProfileUpdated) onProfileUpdated();
        addToast('Profile picture uploaded and saved live to Firestore!', 'success');
      } catch (firestoreErr) {
        console.error('Firestore save error:', firestoreErr);
        if (firestoreErr.code === 'permission-denied' || firestoreErr.message?.includes('permission')) {
          addToast('Photo uploaded to Cloudinary! But Firestore write permission was denied. Please publish your rules in Firebase Console.', 'warning');
        } else {
          addToast(`Photo uploaded, but database save failed: ${firestoreErr.message}`, 'error');
        }
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      addToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingPhoto(false);
      setPhotoProgress(0);
    }
  };

  const handleSaveCustomPhotoUrl = async (e) => {
    if (e) e.preventDefault();
    const cleanUrl = (customPhotoUrl || '').trim();
    if (!cleanUrl) {
      addToast('Please enter an image URL', 'error');
      return;
    }
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
      addToast('URL must start with http://, https://, or /', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const updated = {
        ...formData,
        profileImageUrl: cleanUrl,
      };
      setFormData(updated);
      await updateProfile(updated);
      if (onProfileUpdated) onProfileUpdated();
      addToast('Profile picture URL updated and saved live!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save photo URL', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPhoto = async () => {
    if (!window.confirm('Reset profile picture back to default local image?')) return;
    try {
      setSelectedPhotoFile(null);
      setPhotoPreview('');
      const defaultUrl = INITIAL_PROFILE.profileImageUrl;
      setCustomPhotoUrl('');
      const updated = {
        ...formData,
        profileImageUrl: defaultUrl,
      };
      setFormData(updated);
      await updateProfile(updated);
      if (onProfileUpdated) onProfileUpdated();
      addToast('Profile picture reset to default original and saved live!', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to reset profile picture', 'error');
    }
  };

  const handleCopyPhotoUrl = () => {
    const url = formData.profileImageUrl || INITIAL_PROFILE.profileImageUrl;
    const full = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    setCopiedPhotoUrl(true);
    addToast('Profile picture link copied to clipboard!', 'info');
    setTimeout(() => setCopiedPhotoUrl(false), 2000);
  };

  // CV handlers
  const handleCvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast('CV file size exceeds 10MB limit (Cloudinary maximum)', 'error');
      return;
    }

    setSelectedCvFile(file);
  };

  const handleUploadCv = async () => {
    if (!selectedCvFile) return;

    setIsUploadingCv(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedCvFile);
      uploadFormData.append('folder', 'portfolio-cv');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/cloudinary');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.url) resolve(res);
              else reject(new Error(res.error || 'Upload failed'));
            } catch {
              reject(new Error('Invalid response from upload server'));
            }
          } else {
            let errorMsg = `Upload failed with status ${xhr.status}`;
            try {
              const errData = JSON.parse(xhr.responseText);
              if (errData.error) errorMsg = errData.error;
            } catch {}
            reject(new Error(errorMsg));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during CV upload'));
      });

      xhr.send(uploadFormData);
      const res = await uploadPromise;

      const updated = {
        ...formData,
        cvUrl: res.url,
        cvFileName: selectedCvFile.name,
      };
      setFormData(updated);

      setSelectedCvFile(null);

      // Auto-persist directly to Firestore
      try {
        await updateProfile(updated);
        if (onProfileUpdated) onProfileUpdated();
        addToast('CV uploaded and updated live on all download buttons!', 'success');
      } catch (firestoreErr) {
        console.error('Firestore save error:', firestoreErr);
        if (firestoreErr.code === 'permission-denied' || firestoreErr.message?.includes('permission')) {
          addToast('CV uploaded to Cloudinary! But Firestore write permission was denied. Please publish your rules in Firebase Console.', 'warning');
        } else {
          addToast(`CV uploaded, but database save failed: ${firestoreErr.message}`, 'error');
        }
      }
    } catch (err) {
      console.error('CV upload error:', err);
      addToast(err.message || 'Failed to upload CV file', 'error');
    } finally {
      setIsUploadingCv(false);
      setUploadProgress(0);
    }
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      addToast('All Profile, CV & About details saved successfully!', 'success');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      addToast(err.message || 'Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Stack management helpers
  const handleAddTag = (stackIndex) => {
    const text = (newTagInputs[stackIndex] || '').trim();
    if (!text) return;

    setFormData((prev) => {
      const updated = [...prev.skillStacks];
      if (!updated[stackIndex].skills.includes(text)) {
        updated[stackIndex] = {
          ...updated[stackIndex],
          skills: [...updated[stackIndex].skills, text],
        };
      }
      return { ...prev, skillStacks: updated };
    });

    setNewTagInputs((prev) => ({ ...prev, [stackIndex]: '' }));
  };

  const handleRemoveTag = (stackIndex, tagToRemove) => {
    setFormData((prev) => {
      const updated = [...prev.skillStacks];
      updated[stackIndex] = {
        ...updated[stackIndex],
        skills: updated[stackIndex].skills.filter((s) => s !== tagToRemove),
      };
      return { ...prev, skillStacks: updated };
    });
  };

  const handleAddStackCategory = () => {
    const catName = newCategoryName.trim();
    if (!catName) return;

    setFormData((prev) => ({
      ...prev,
      skillStacks: [
        ...prev.skillStacks,
        { title: catName, skills: [] },
      ],
    }));
    setNewCategoryName('');
  };

  const handleRemoveStackCategory = (index) => {
    if (!window.confirm('Delete this stack category?')) return;
    setFormData((prev) => ({
      ...prev,
      skillStacks: prev.skillStacks.filter((_, i) => i !== index),
    }));
  };

  const activePhoto = photoPreview || formData.profileImageUrl || INITIAL_PROFILE.profileImageUrl;

  return (
    <div className="space-y-8">
      {/* Top Banner with Save Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Profile Picture, About Me & CV</h2>
            <p className="text-xs text-slate-400">
              Update your hero profile picture, CV document, biography, and skill stack tags.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>Save All Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Picture & CV */}
        <div className="lg:col-span-7 space-y-6">
          {/* ── PROFILE PICTURE MANAGEMENT CARD ──────────────────── */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
            {/* Header & Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Profile Picture</h3>
                    {formData.profileImageUrl?.startsWith('http') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Cloud Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400">
                        Default Local
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Live hero section floating bubble, admin sidebar avatar, and portfolio branding.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium transition"
                  title="Reset to default original picture"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Dual Live Preview Display */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row items-center gap-8 justify-around">
              {/* Preview 1: Hero Section Floating Blob */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Hero Blob Preview
                </span>
                <div className="relative group">
                  {/* Outer gradient glow */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600 rounded-[55%_45%_55%_45%] opacity-60 blur-md group-hover:opacity-100 transition duration-500" />
                  
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-[55%_45%_55%_45%] overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-900">
                    <img
                      src={activePhoto}
                      alt="Hero Profile Preview"
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                  {photoPreview && (
                    <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
                      Preview
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">Home Hero Floating Bubble</span>
              </div>

              {/* Preview 2: Round Avatar Preview */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-indigo-400" />
                  Round Avatar Preview
                </span>
                <div className="relative">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-indigo-500/40 shadow-xl bg-slate-900">
                    <img
                      src={activePhoto}
                      alt="Round Avatar Preview"
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-slate-950" title="Online status indicator" />
                </div>
                <span className="text-[10px] text-slate-400">Admin Sidebar & Profile Badge</span>
              </div>
            </div>

            {/* Input Mode Switcher: Upload File vs Image URL */}
            <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setPhotoInputMode('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                  photoInputMode === 'file'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image File</span>
              </button>
              <button
                type="button"
                onClick={() => setPhotoInputMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                  photoInputMode === 'url'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Direct Image URL</span>
              </button>
            </div>

            {/* Mode 1: Upload File with Drag & Drop */}
            {photoInputMode === 'file' && (
              <div className="space-y-3">
                <div
                  onDragOver={handlePhotoDragOver}
                  onDragLeave={handlePhotoDragLeave}
                  onDrop={handlePhotoDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    isDraggingPhoto
                      ? 'border-indigo-400 bg-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                  onClick={() => document.getElementById('profile-photo-input')?.click()}
                >
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/jpg"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Drag & drop your new profile picture here, or <span className="text-cyan-400 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supported: JPG, PNG, WEBP, GIF (Auto-optimized to fit Cloudinary 10MB limit)
                    </p>
                  </div>
                </div>

                {/* Selected File Details */}
                {selectedPhotoFile && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                        <img src={photoPreview} alt="Selected" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-xs">{selectedPhotoFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(selectedPhotoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoFile(null);
                        setPhotoPreview('');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={!selectedPhotoFile || isUploadingPhoto}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading & Saving ({photoProgress}%)</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload & Save Live to Profile</span>
                      </>
                    )}
                  </button>
                </div>

                {isUploadingPhoto && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${photoProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Direct Image URL */}
            {photoInputMode === 'url' && (
              <form onSubmit={handleSaveCustomPhotoUrl} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Image URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/.../profile.jpg"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isSaving || !customPhotoUrl.trim()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition disabled:opacity-40 shadow-sm"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Live'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Paste any direct image URL (Cloudinary, Imgur, GitHub, etc.) to set it immediately.
                  </p>
                </div>
              </form>
            )}

            {/* Image link & actions toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] min-w-0">
                <span className="font-semibold text-slate-300 shrink-0">Current Asset:</span>
                <span className="truncate max-w-[200px] sm:max-w-xs text-slate-400 font-mono">
                  {formData.profileImageUrl || INITIAL_PROFILE.profileImageUrl}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPhotoUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition"
                  title="Copy image link"
                >
                  {copiedPhotoUrl ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhotoUrl ? 'Copied!' : 'Copy Link'}</span>
                </button>

                {formData.profileImageUrl && (
                  <a
                    href={formData.profileImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── CV UPLOAD BOX ────────────────────────────────────── */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Curriculum Vitae (CV)</h3>
            </div>

            {/* Current Active CV Status */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium">Active CV File</p>
                  <p className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-sm">
                    {formData.cvFileName || 'Jahan_Jayalath-CV.pdf'}
                  </p>
                </div>
              </div>

              {formData.cvUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={formData.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </a>
                  <a
                    href={formData.cvUrl}
                    download={formData.cvFileName || 'CV.pdf'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            {/* Upload New CV File */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Upload New CV Document (PDF)
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleCvFileChange}
                  className="flex-1 text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer border border-slate-800 rounded-xl bg-slate-950/60 p-2"
                />

                <button
                  type="button"
                  onClick={handleUploadCv}
                  disabled={!selectedCvFile || isUploadingCv}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isUploadingCv ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Link</span>
                    </>
                  )}
                </button>
              </div>

              {isUploadingCv && (
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── ABOUT ME BIO SECTION ─────────────────────────────── */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <User className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">About Me Introduction</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Section Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="My introduction"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Biography / Summary Text
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formData.bio?.length || 0} characters
                </span>
              </div>
              <textarea
                rows={7}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
                placeholder="Write your professional introduction here..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Skill Stacks inside About Me */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">About Me Skill Stacks</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              These skill tags are displayed in the right column of your public "About Me" section (e.g. Frontend, Backend, Database).
            </p>

            {/* List of stacks */}
            <div className="space-y-4">
              {formData.skillStacks?.map((stack, stackIdx) => (
                <div
                  key={stack.title || stackIdx}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{stack.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveStackCategory(stackIdx)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {stack.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(stackIdx, skill)}
                          className="hover:text-rose-300 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add tag to this stack */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder={`Add skill to ${stack.title}...`}
                      value={newTagInputs[stackIdx] || ''}
                      onChange={(e) =>
                        setNewTagInputs({ ...newTagInputs, [stackIdx]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(stackIdx);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(stackIdx)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 border border-slate-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Stack Category */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Add New Stack Category
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Cloud & DevOps, Mobile..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStackCategory();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={handleAddStackCategory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
