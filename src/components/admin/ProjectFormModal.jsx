'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Loader2, 
  Plus, 
  Check, 
  Image as ImageIcon,
  Github,
  Sparkles,
  ExternalLink,
  Search,
  RefreshCw,
  FolderGit2,
  Star,
} from 'lucide-react';
import { uploadProjectImage } from '../../lib/storage';
import { useToast } from '../Toast';

export default function ProjectFormModal({
  isOpen,
  onClose,
  onSave,
  initialProject = null,
}) {
  const { addToast } = useToast();
  const isEditing = Boolean(initialProject && initialProject.id);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Web Application',
    shortDescription: '',
    description: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    imagePath: '',
    imageAlt: '',
    featured: false,
    published: true,
    order: 1,
  });

  const [techInput, setTechInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingGh, setIsExtractingGh] = useState(false);
  const [githubInputBar, setGithubInputBar] = useState('');
  const [githubUsername, setGithubUsername] = useState('JahanRazh');
  const [userRepos, setUserRepos] = useState([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [ghTab, setGhTab] = useState('select'); // 'select' | 'url'
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');

  const fetchUserRepositories = async (usernameToFetch) => {
    const user = (usernameToFetch || githubUsername || 'JahanRazh').trim();
    if (!user) return;
    setIsLoadingRepos(true);

    try {
      const res = await fetch(`/api/github-repos?username=${encodeURIComponent(user)}`);
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.repos)) {
        setUserRepos(result.repos);
      } else {
        console.warn('Could not fetch repos:', result.error);
        addToast(result.error || 'Failed to fetch repositories', 'warning');
      }
    } catch (err) {
      console.error('Error fetching repos:', err);
      addToast('Error loading GitHub repositories: ' + err.message, 'error');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (isOpen && userRepos.length === 0) {
      fetchUserRepositories('JahanRazh');
    }
  }, [isOpen]);

  const handleAutoFillFromGitHub = async (overrideUrl) => {
    const targetUrl = (overrideUrl || selectedRepoUrl || githubInputBar || formData.githubUrl || '').trim();

    if (!targetUrl) {
      addToast('Please select a repository or enter a GitHub URL', 'error');
      return;
    }

    if (!targetUrl.includes('github.com')) {
      addToast('Please provide a valid GitHub link (e.g. https://github.com/owner/repo)', 'error');
      return;
    }

    setSelectedRepoUrl(targetUrl);
    setGithubInputBar(targetUrl);
    setIsExtractingGh(true);
    addToast('✨ Fetching repository & analyzing README...', 'info');

    try {
      const res = await fetch('/api/extract-github-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: targetUrl }),
      });

      const result = await res.json();

      if (res.ok && result.success && result.data) {
        const {
          name,
          category,
          shortDescription,
          description,
          technologies,
          githubUrl,
          liveUrl,
          imageUrl,
        } = result.data;

        setFormData((prev) => ({
          ...prev,
          name: name || prev.name,
          category: category || prev.category,
          shortDescription: shortDescription || prev.shortDescription,
          description: description || prev.description,
          technologies: Array.isArray(technologies) && technologies.length > 0 ? technologies : prev.technologies,
          githubUrl: githubUrl || targetUrl,
          liveUrl: liveUrl || prev.liveUrl,
          imageUrl: imageUrl || prev.imageUrl,
        }));

        if (imageUrl) {
          setImagePreview(imageUrl);
        }

        addToast('✨ Project details & README images auto-filled!', 'success');
      } else {
        console.warn('GitHub extraction returned error:', result.error);
        addToast(result.error || 'Could not auto-fill details from GitHub repository', 'warning');
      }
    } catch (err) {
      console.error('Error auto-filling from GitHub:', err);
      addToast('GitHub auto-fill failed: ' + err.message, 'error');
    } finally {
      setIsExtractingGh(false);
    }
  };

  useEffect(() => {
    if (initialProject) {
      setFormData({
        name: initialProject.name || '',
        category: initialProject.category || 'Web Application',
        shortDescription: initialProject.shortDescription || '',
        description: initialProject.description || '',
        technologies: Array.isArray(initialProject.technologies) ? initialProject.technologies : [],
        githubUrl: initialProject.githubUrl || '',
        liveUrl: initialProject.liveUrl || '',
        imageUrl: initialProject.imageUrl || '',
        imagePath: initialProject.imagePath || '',
        imageAlt: initialProject.imageAlt || '',
        featured: Boolean(initialProject.featured),
        published: initialProject.published !== undefined ? Boolean(initialProject.published) : true,
        order: initialProject.order !== undefined ? Number(initialProject.order) : 1,
      });
      setImagePreview(initialProject.imageUrl || '');
    } else {
      setFormData({
        name: '',
        category: 'Web Application',
        shortDescription: '',
        description: '',
        technologies: ['React', 'Next.js'],
        githubUrl: '',
        liveUrl: '',
        imageUrl: '',
        imagePath: '',
        imageAlt: '',
        featured: false,
        published: true,
        order: 1,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setUploadProgress(0);
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !formData.technologies.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, trimmed],
      }));
      setTechInput('');
    }
  };

  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTech();
    }
  };

  const handleRemoveTech = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tagToRemove),
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast('Image size exceeds 10MB limit', 'error');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, imageUrl: '', imagePath: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Project name is required', 'error');
      return;
    }

    setIsSaving(true);

    try {
      let finalImageUrl = formData.imageUrl;
      let finalImagePath = formData.imagePath;

      // If user selected a new file, upload to Firebase Storage
      if (imageFile) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadProjectImage(imageFile, (progress) => {
            setUploadProgress(progress);
          });
          finalImageUrl = uploadResult.downloadUrl;
          finalImagePath = uploadResult.storagePath;
          addToast('Image uploaded successfully', 'success');
        } catch (uploadErr) {
          console.warn('Cloudinary upload failed, keeping current image or preview:', uploadErr);
          // If upload fails, fallback gracefully to existing preview
          if (!finalImageUrl) {
            finalImageUrl = imagePreview;
          }
        } finally {
          setIsUploading(false);
        }
      }

      const projectToSave = {
        ...formData,
        imageUrl: finalImageUrl,
        imagePath: finalImagePath,
        order: Number(formData.order) || 1,
      };

      await onSave(projectToSave);
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      addToast(error.message || 'Failed to save project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden z-10 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {isEditing ? 'Edit Project' : 'Add New Project'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Fill in the project details below to update your dynamic portfolio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Auto-Fill with GitHub bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl space-y-4">
            {/* Header with user info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-300">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Connect GitHub & Auto-Fill</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Gemini AI
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a repository from your GitHub to auto-fill title, descriptions, tags, demo URL & README images.
                  </p>
                </div>
              </div>

              {/* GitHub Username input & refresh */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 self-start sm:self-auto">
                <div className="flex items-center pl-2.5 text-xs text-slate-400 font-mono">
                  @
                </div>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      fetchUserRepositories(githubUsername);
                    }
                  }}
                  placeholder="GitHub username"
                  className="bg-transparent px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none w-28 sm:w-32 font-medium"
                />
                <button
                  type="button"
                  disabled={isLoadingRepos}
                  onClick={() => fetchUserRepositories(githubUsername)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
                  title="Fetch user repositories"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mode switch tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGhTab('select')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  ghTab === 'select'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>My Repositories ({userRepos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setGhTab('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  ghTab === 'url'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>Direct Repo URL</span>
              </button>
            </div>

            {/* Tab 1: Pick from My Repositories */}
            {ghTab === 'select' && (
              <div className="space-y-2.5">
                {isLoadingRepos ? (
                  <div className="flex items-center justify-center gap-2 p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Loading repositories for @{githubUsername}...</span>
                  </div>
                ) : userRepos.length > 0 ? (
                  <div className="space-y-2">
                    {/* Search & dropdown select */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedRepoUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedRepoUrl(val);
                            if (val) handleAutoFillFromGitHub(val);
                          }}
                          disabled={isExtractingGh}
                          className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition cursor-pointer disabled:opacity-50"
                        >
                          <option value="">-- Click to choose a repository to auto-fill --</option>
                          {userRepos.map((repo) => (
                            <option key={repo.id} value={repo.htmlUrl}>
                              {repo.name} {repo.language ? `[${repo.language}]` : ''} {repo.stars > 0 ? `(★ ${repo.stars})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedRepoUrl && (
                        <button
                          type="button"
                          disabled={isExtractingGh}
                          onClick={() => handleAutoFillFromGitHub(selectedRepoUrl)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition disabled:opacity-50 shrink-0"
                        >
                          {isExtractingGh ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>{isExtractingGh ? 'Reading...' : 'Auto-Fill Details'}</span>
                        </button>
                      )}
                    </div>

                    {/* Quick-click Top 4 Recent Repos */}
                    <div className="pt-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Recent Repositories:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {userRepos.slice(0, 4).map((repo) => (
                          <button
                            key={repo.id}
                            type="button"
                            disabled={isExtractingGh}
                            onClick={() => {
                              setSelectedRepoUrl(repo.htmlUrl);
                              handleAutoFillFromGitHub(repo.htmlUrl);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 group ${
                              selectedRepoUrl === repo.htmlUrl
                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate group-hover:text-indigo-300 transition">
                                {repo.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                {repo.language && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300">
                                    {repo.language}
                                  </span>
                                )}
                                {repo.stars > 0 && (
                                  <span className="flex items-center gap-0.5 text-amber-400">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    {repo.stars}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] text-indigo-400 font-semibold group-hover:translate-x-0.5 transition shrink-0">
                              Select →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">No public repositories found for @{githubUsername}.</p>
                    <button
                      type="button"
                      onClick={() => fetchUserRepositories(githubUsername)}
                      className="mt-2 text-xs text-indigo-400 hover:underline font-semibold"
                    >
                      Try refreshing
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Direct Repo URL */}
            {ghTab === 'url' && (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    value={githubInputBar}
                    onChange={(e) => {
                      setGithubInputBar(e.target.value);
                      setFormData((prev) => ({ ...prev, githubUrl: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutoFillFromGitHub(githubInputBar);
                      }
                    }}
                    placeholder="https://github.com/owner/repository"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <button
                  type="button"
                  disabled={isExtractingGh}
                  onClick={() => handleAutoFillFromGitHub(githubInputBar)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition disabled:opacity-50 shrink-0"
                >
                  {isExtractingGh ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isExtractingGh ? 'Reading Repository...' : 'Auto-Fill with AI'}</span>
                </button>
              </div>
            )}

            {/* Progress status while extracting */}
            {isExtractingGh && (
              <div className="pt-2 border-t border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-amber-400" />
                <span>Fetching repository metadata, parsing README.md and extracting preview images with Gemini AI...</span>
              </div>
            )}
          </div>

          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. STELLAR-BUILD-ERP System"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
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
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Web Application">Web Application</option>
                <option value="Mobile Application">Mobile Application</option>
                <option value="Mobile Game">Mobile Game</option>
                <option value="AI / Machine Learning">AI / Machine Learning</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Desktop Application">Desktop Application</option>
              </select>
            </div>
          </div>

          {/* Row 2: Short Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Short Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="shortDescription"
              required
              value={formData.shortDescription}
              onChange={handleInputChange}
              placeholder="Brief summary visible on project card"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Row 3: Full Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Full Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed description of features, architecture, and accomplishments..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Row 4: Technologies Tag Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Technologies (Tags)
            </label>
            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={handleTechKeyDown}
                placeholder="Type tech and press Enter (e.g. React, Node.js)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {formData.technologies.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="hover:text-rose-400 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Row 5: URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  GitHub / Repository URL
                </label>
                {formData.githubUrl && formData.githubUrl.includes('github.com') && (
                  <button
                    type="button"
                    disabled={isExtractingGh}
                    onClick={() => handleAutoFillFromGitHub(formData.githubUrl)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Auto-Fill from URL</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={(e) => {
                    handleInputChange(e);
                    setGithubInputBar(e.target.value);
                  }}
                  placeholder="https://github.com/owner/repository"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Live Demo URL
              </label>
              <div className="relative">
                <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  name="liveUrl"
                  value={formData.liveUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-demo-url.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Image Upload to Cloudinary / README */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Project Image
              </label>
              <span className="text-xs text-slate-400">JPG, PNG, GIF, WEBP up to 10MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview Box */}
              <div className="relative w-40 h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span>No image</span>
                  </div>
                )}
              </div>

              {/* Upload Input & Actions */}
              <div className="flex-1 w-full space-y-2">
                {formData.imageUrl && !imageFile && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate max-w-xs">Using README preview image</span>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition">
                    <Upload className="w-4 h-4" />
                    <span>Upload Custom Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
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
                        className="h-full bg-cyan-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Accessible Alt Text */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Image Alt Text (Accessibility)
              </label>
              <input
                type="text"
                name="imageAlt"
                value={formData.imageAlt}
                onChange={handleInputChange}
                placeholder="Descriptive alt text for screen readers"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 7: Toggles & Display Order */}
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div>
                <p className="text-xs font-bold text-white">Featured</p>
                <p className="text-[11px] text-slate-400">Highlight in Featured section</p>
              </div>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <div>
                <p className="text-xs font-bold text-white">Published</p>
                <p className="text-[11px] text-slate-400">Live on public website</p>
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

          {/* Footer Actions */}
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create Project'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
