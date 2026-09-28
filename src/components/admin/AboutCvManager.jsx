'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Save,
  AlertCircle,
  Phone,
  Mail,
  PhoneCall,
} from 'lucide-react';
import { useToast } from '../Toast';
import { updateProfile, INITIAL_PROFILE } from '../../lib/firestore';
import { compressImageIfNeeded } from '../../lib/imageCompressor';
import { getDirectDownloadUrl, downloadPdfDirectly } from '../../lib/downloadHelper';

export default function AboutCvManager({ profileData = null, onProfileUpdated }) {
  const { addToast } = useToast();

  const [formData, setFormData] = useState(INITIAL_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingIntro, setIsSavingIntro] = useState(false);
  const [isSavingStacks, setIsSavingStacks] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Track if user has made local changes so background snapshots don't overwrite active typing
  const hasUserEditedRef = useRef(false);

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
      setFormData((prev) => {
        // If the user has made unsaved edits, do not wipe out their active text inputs
        if (hasUserEditedRef.current) {
          return {
            ...prev,
            profileImageUrl: profileData.profileImageUrl || prev.profileImageUrl || INITIAL_PROFILE.profileImageUrl,
            cvUrl: profileData.cvUrl || prev.cvUrl || INITIAL_PROFILE.cvUrl,
            cvFileName: profileData.cvFileName || prev.cvFileName || INITIAL_PROFILE.cvFileName,
          };
        }
        return {
          heroBadge: profileData.heroBadge || INITIAL_PROFILE.heroBadge,
          heroTitles: Array.isArray(profileData.heroTitles) && profileData.heroTitles.length > 0
            ? profileData.heroTitles
            : INITIAL_PROFILE.heroTitles,
          heroIntro: profileData.heroIntro || INITIAL_PROFILE.heroIntro,
          aboutBadge: profileData.aboutBadge || INITIAL_PROFILE.aboutBadge,
          title: profileData.title || INITIAL_PROFILE.title,
          bio: profileData.bio || INITIAL_PROFILE.bio,
          profileImageUrl: profileData.profileImageUrl || INITIAL_PROFILE.profileImageUrl,
          cvUrl: profileData.cvUrl || INITIAL_PROFILE.cvUrl,
          cvFileName: profileData.cvFileName || INITIAL_PROFILE.cvFileName,
          skillStacks: Array.isArray(profileData.skillStacks) && profileData.skillStacks.length > 0
            ? profileData.skillStacks
            : INITIAL_PROFILE.skillStacks,
          contactPhone: profileData.contactPhone !== undefined ? profileData.contactPhone : INITIAL_PROFILE.contactPhone,
          contactEmail: profileData.contactEmail !== undefined ? profileData.contactEmail : INITIAL_PROFILE.contactEmail,
          contactWhatsapp: profileData.contactWhatsapp !== undefined ? profileData.contactWhatsapp : INITIAL_PROFILE.contactWhatsapp,
          findMeTitle: profileData.findMeTitle !== undefined ? profileData.findMeTitle : INITIAL_PROFILE.findMeTitle,
          findMeText: profileData.findMeText !== undefined ? profileData.findMeText : INITIAL_PROFILE.findMeText,
        };
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
        const saved = await updateProfile(updated);
        setFormData((prev) => ({ ...prev, ...saved }));
        hasUserEditedRef.current = false;
        if (onProfileUpdated) onProfileUpdated(saved);
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
      const saved = await updateProfile(updated);
      setFormData((prev) => ({ ...prev, ...saved }));
      hasUserEditedRef.current = false;
      if (onProfileUpdated) onProfileUpdated(saved);
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
      const saved = await updateProfile(updated);
      setFormData((prev) => ({ ...prev, ...saved }));
      hasUserEditedRef.current = false;
      if (onProfileUpdated) onProfileUpdated(saved);
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
        const saved = await updateProfile(updated);
        setFormData((prev) => ({ ...prev, ...saved }));
        hasUserEditedRef.current = false;
        if (onProfileUpdated) onProfileUpdated(saved);
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

  const handleHeroBadgeChange = (e) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => ({ ...prev, heroBadge: e.target.value }));
  };

  const handleHeroIntroChange = (e) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => ({ ...prev, heroIntro: e.target.value }));
  };

  const handleAddHeroTitle = () => {
    const text = newRoleInput.trim();
    if (!text) return;
    hasUserEditedRef.current = true;
    setFormData((prev) => {
      const currentTitles = Array.isArray(prev.heroTitles) ? prev.heroTitles : [...INITIAL_PROFILE.heroTitles];
      if (!currentTitles.includes(text)) {
        return { ...prev, heroTitles: [...currentTitles, text] };
      }
      return prev;
    });
    setNewRoleInput('');
  };

  const handleRemoveHeroTitle = (titleToRemove) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => {
      const currentTitles = Array.isArray(prev.heroTitles) ? prev.heroTitles : [...INITIAL_PROFILE.heroTitles];
      return { ...prev, heroTitles: currentTitles.filter((t) => t !== titleToRemove) };
    });
  };

  const savedHeroBadge = profileData?.heroBadge || INITIAL_PROFILE.heroBadge;
  const savedHeroTitles = Array.isArray(profileData?.heroTitles) && profileData.heroTitles.length > 0
    ? profileData.heroTitles
    : INITIAL_PROFILE.heroTitles;
  const savedHeroIntro = profileData?.heroIntro || INITIAL_PROFILE.heroIntro;

  const isHeroDirty =
    (formData.heroBadge || '') !== (savedHeroBadge || '') ||
    (formData.heroIntro || '') !== (savedHeroIntro || '') ||
    JSON.stringify(formData.heroTitles || []) !== JSON.stringify(savedHeroTitles);

  const handleSaveHeroIntroduction = async (e) => {
    if (e) e.preventDefault();
    if (!formData.heroIntro?.trim()) {
      addToast('Profile introduction summary text cannot be empty', 'warning');
      return;
    }

    setIsSavingHero(true);
    try {
      const saved = await updateProfile(formData);
      setFormData((prev) => ({ ...prev, ...saved }));
      hasUserEditedRef.current = false;
      addToast('Profile section introduction saved successfully! Changes are live on home hero.', 'success');
      if (onProfileUpdated) onProfileUpdated(saved);
    } catch (err) {
      console.error('Save profile intro error:', err);
      addToast(err.message || 'Failed to save profile introduction', 'error');
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleResetHeroIntroduction = () => {
    setFormData((prev) => ({
      ...prev,
      heroBadge: savedHeroBadge,
      heroTitles: savedHeroTitles,
      heroIntro: savedHeroIntro,
    }));
    hasUserEditedRef.current = false;
    addToast('Profile section introduction reverted to saved version', 'info');
  };

  const handleAboutBadgeChange = (e) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => ({ ...prev, aboutBadge: e.target.value }));
  };

  const handleTitleChange = (e) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleBioChange = (e) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => ({ ...prev, bio: e.target.value }));
  };

  const savedAboutBadge = profileData?.aboutBadge || INITIAL_PROFILE.aboutBadge;
  const savedTitle = profileData?.title || INITIAL_PROFILE.title;
  const savedBio = profileData?.bio || INITIAL_PROFILE.bio;
  const isIntroDirty =
    (formData.aboutBadge || '') !== (savedAboutBadge || '') ||
    (formData.title || '') !== (savedTitle || '') ||
    (formData.bio || '') !== (savedBio || '');

  const handleSaveIntroduction = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title?.trim()) {
      addToast('Please provide a section title', 'warning');
      return;
    }
    if (!formData.bio?.trim()) {
      addToast('Please provide a biography text', 'warning');
      return;
    }

    setIsSavingIntro(true);
    try {
      const saved = await updateProfile(formData);
      setFormData((prev) => ({ ...prev, ...saved }));
      hasUserEditedRef.current = false;
      addToast('About Me introduction saved successfully! Changes are live on your portfolio.', 'success');
      if (onProfileUpdated) onProfileUpdated(saved);
    } catch (err) {
      console.error('Save introduction error:', err);
      addToast(err.message || 'Failed to save introduction', 'error');
    } finally {
      setIsSavingIntro(false);
    }
  };

  const handleResetIntroduction = () => {
    setFormData((prev) => ({
      ...prev,
      aboutBadge: profileData?.aboutBadge || INITIAL_PROFILE.aboutBadge,
      title: profileData?.title || INITIAL_PROFILE.title,
      bio: profileData?.bio || INITIAL_PROFILE.bio,
    }));
    hasUserEditedRef.current = false;
    addToast('Introduction reverted to last saved version', 'info');
  };

  const handleContactFieldChange = (field, value) => {
    hasUserEditedRef.current = true;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const savedContactPhone = profileData?.contactPhone || INITIAL_PROFILE.contactPhone;
  const savedContactEmail = profileData?.contactEmail || INITIAL_PROFILE.contactEmail;
  const savedContactWhatsapp = profileData?.contactWhatsapp || INITIAL_PROFILE.contactWhatsapp;
  const savedFindMeTitle = profileData?.findMeTitle || INITIAL_PROFILE.findMeTitle;
  const savedFindMeText = profileData?.findMeText || INITIAL_PROFILE.findMeText;

  const isContactDirty =
    (formData.contactPhone || '') !== (savedContactPhone || '') ||
    (formData.contactEmail || '') !== (savedContactEmail || '') ||
    (formData.contactWhatsapp || '') !== (savedContactWhatsapp || '') ||
    (formData.findMeTitle || '') !== (savedFindMeTitle || '') ||
    (formData.findMeText || '') !== (savedFindMeText || '');

  const handleSaveContact = async (e) => {
    if (e) e.preventDefault();
    if (!formData.contactPhone?.trim()) {
      addToast('Phone number cannot be empty', 'warning');
      return;
    }
    if (!formData.contactEmail?.trim()) {
      addToast('Email address cannot be empty', 'warning');
      return;
    }

    setIsSavingContact(true);
    try {
      const saved = await updateProfile(formData);
      setFormData((prev) => ({ ...prev, ...saved }));
      hasUserEditedRef.current = false;
      addToast('Find Me contact details saved successfully! Changes are live on your portfolio.', 'success');
      if (onProfileUpdated) onProfileUpdated(saved);
    } catch (err) {
      console.error('Save contact error:', err);
      addToast(err.message || 'Failed to save contact details', 'error');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleResetContact = () => {
    setFormData((prev) => ({
      ...prev,
      contactPhone: savedContactPhone,
      contactEmail: savedContactEmail,
      contactWhatsapp: savedContactWhatsapp,
      findMeTitle: savedFindMeTitle,
      findMeText: savedFindMeText,
    }));
    hasUserEditedRef.current = false;
    addToast('Find Me contact details reverted to saved version', 'info');
  };

  const handleSaveSkillStacks = async (e) => {
    if (e) e.preventDefault();
    setIsSavingStacks(true);
    try {
      const saved = await updateProfile(formData);
      setFormData((prev) => ({ ...prev, ...saved }));
      hasUserEditedRef.current = false;
      addToast('Skill stacks saved successfully! Changes are live on your portfolio.', 'success');
      if (onProfileUpdated) onProfileUpdated(saved);
    } catch (err) {
      console.error('Save skill stacks error:', err);
      addToast(err.message || 'Failed to save skill stacks', 'error');
    } finally {
      setIsSavingStacks(false);
    }
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await updateProfile(formData);
      setFormData((prev) => ({ ...prev, ...saved }));
      hasUserEditedRef.current = false;
      addToast('All Profile, CV & About details saved successfully!', 'success');
      if (onProfileUpdated) onProfileUpdated(saved);
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

    hasUserEditedRef.current = true;
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
    hasUserEditedRef.current = true;
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

    hasUserEditedRef.current = true;
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
    hasUserEditedRef.current = true;
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
            <h2 className="text-lg font-bold text-white">Profile, Bio, CV & Contact ("Find Me")</h2>
            <p className="text-xs text-slate-400">
              Update your hero photo, introduction, CV document, biography, skill stacks, and "Find Me" direct contact details (Phone, Email, WhatsApp).
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
                    href={getDirectDownloadUrl(formData.cvUrl, formData.cvFileName || 'CV.pdf')}
                    download={formData.cvFileName || 'CV.pdf'}
                    onClick={(e) => {
                      e.preventDefault();
                      downloadPdfDirectly(formData.cvUrl, formData.cvFileName || 'CV.pdf');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition cursor-pointer"
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

          {/* ── PROFILE / HERO SECTION INTRODUCTION ──────────────── */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Profile / Hero Section Introduction</h3>
                  <p className="text-xs text-slate-400">Header badge, animated role titles, and hero introduction</p>
                </div>
              </div>

              {isHeroDirty ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  Saved & Synced
                </span>
              )}
            </div>

            {/* Profile Badge / Headline */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Profile Badge / Headline
              </label>
              <input
                type="text"
                value={formData.heroBadge || ''}
                onChange={handleHeroBadgeChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                placeholder="Software Engineer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Pill badge displayed above your name on the home page hero section.
              </p>
            </div>

            {/* Animated Typing Role Titles */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Animated Role Titles (Typewriter)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.heroTitles || INITIAL_PROFILE.heroTitles).map((title, idx) => (
                  <span
                    key={`${title}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  >
                    <span>{title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHeroTitle(title)}
                      className="hover:text-rose-400 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add role title (e.g. Full Stack Developer, AI Enthusiast)..."
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHeroTitle();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddHeroTitle}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 transition"
                >
                  Add Title
                </button>
              </div>
            </div>

            {/* Hero Introduction Paragraph */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Profile Introduction Paragraph
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formData.heroIntro?.length || 0} characters
                </span>
              </div>
              <textarea
                rows={6}
                value={formData.heroIntro || ''}
                onChange={handleHeroIntroChange}
                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y transition"
                placeholder="Write your hero profile introduction here..."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This summary text appears directly beneath your name and animated title on the portfolio landing page.
              </p>
            </div>

            {/* Save / Revert Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instantly updates hero landing section upon saving</span>
              </div>

              <div className="flex items-center gap-2.5">
                {isHeroDirty && (
                  <button
                    type="button"
                    onClick={handleResetHeroIntroduction}
                    disabled={isSavingHero}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveHeroIntroduction}
                  disabled={isSavingHero}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
                >
                  {isSavingHero ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving Profile Intro...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>Save Profile Intro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── ABOUT ME BIO SECTION ─────────────────────────────── */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">About Me Introduction</h3>
                  <p className="text-xs text-slate-400">Public profile title & summary text</p>
                </div>
              </div>

              {isIntroDirty ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  Saved & Synced
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Subtitle Badge / Tagline
              </label>
              <input
                type="text"
                value={formData.aboutBadge || ''}
                onChange={handleAboutBadgeChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="SLIIT Software Engineering Undergraduate"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Displayed as the pill badge directly above the "About Me" heading on your public site.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Section Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="About Ramesh Jahan Jayalath"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Displayed as the main heading in your public "About Me" portfolio section.
              </p>
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
                rows={8}
                value={formData.bio}
                onChange={handleBioChange}
                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y transition"
                placeholder="Write your professional introduction here..."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Line breaks and paragraphs are preserved on your public website.
              </p>
            </div>

            {/* Save / Revert Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instantly updates on public home page upon saving</span>
              </div>

              <div className="flex items-center gap-2.5">
                {isIntroDirty && (
                  <button
                    type="button"
                    onClick={handleResetIntroduction}
                    disabled={isSavingIntro}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveIntroduction}
                  disabled={isSavingIntro}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {isSavingIntro ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Introduction...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Introduction</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Details & Skill Stacks */}
        <div className="lg:col-span-5 space-y-6">
          {/* ── FIND ME / DIRECT CONTACT DETAILS CARD ───────────── */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Find Me / Contact Details</h3>
                  <p className="text-xs text-slate-400">Phone, Email & WhatsApp ("Find Me" card)</p>
                </div>
              </div>

              {isContactDirty ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  Saved & Synced
                </span>
              )}
            </div>

            {/* Direct Phone Number ("no") */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  Phone Number (Direct Call)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">tel: link</span>
              </label>
              <input
                type="text"
                value={formData.contactPhone || ''}
                onChange={(e) => handleContactFieldChange('contactPhone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-mono"
                placeholder="+94 76-722 14 36"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Visitors on mobile or desktop click to dial directly.
              </p>
            </div>

            {/* Direct Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Email Address (Direct Message)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">mailto: link</span>
              </label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => handleContactFieldChange('contactEmail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="jahanrazh@gmail.com"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Direct email opened when visitors click Email in "Find Me".
              </p>
            </div>

            {/* Direct WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  WhatsApp Number (Direct Chat)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">wa.me link</span>
              </label>
              <input
                type="text"
                value={formData.contactWhatsapp || ''}
                onChange={(e) => handleContactFieldChange('contactWhatsapp', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                placeholder="+94 76 722 1436"
              />
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <p className="text-[11px] text-slate-500">
                  Direct chat via <span className="text-emerald-400 font-mono">wa.me/{formData.contactWhatsapp?.replace(/[^0-9]/g, '') || '...'}</span>
                </p>
                {formData.contactWhatsapp && (
                  <a
                    href={`https://wa.me/${formData.contactWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline"
                  >
                    <span>Test Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Find Me Card Headline & Subtext (Optional) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Find Me Card Headline & Text (Optional)
              </span>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Card Title</label>
                <input
                  type="text"
                  value={formData.findMeTitle || ''}
                  onChange={(e) => handleContactFieldChange('findMeTitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Let's start a project together"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Card Subtext</label>
                <textarea
                  rows={2}
                  value={formData.findMeText || ''}
                  onChange={(e) => handleContactFieldChange('findMeText', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 resize-y"
                  placeholder="I am always open to discussing new projects..."
                />
              </div>
            </div>

            {/* Save / Revert Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live sync on "Find Me" card</span>
              </div>

              <div className="flex items-center gap-2.5">
                {isContactDirty && (
                  <button
                    type="button"
                    onClick={handleResetContact}
                    disabled={isSavingContact}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveContact}
                  disabled={isSavingContact}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
                >
                  {isSavingContact ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Contact...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-white" />
                      <span>Save Contact Details</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── ABOUT ME SKILL STACKS ────────────────────────────── */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">About Me Skill Stacks</h3>
              </div>

              <button
                type="button"
                onClick={handleSaveSkillStacks}
                disabled={isSavingStacks}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
              >
                {isSavingStacks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Stacks</span>
              </button>
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

            {/* Bottom Save Action for Skill Stacks */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSkillStacks}
                disabled={isSavingStacks}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {isSavingStacks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Skill Stacks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
