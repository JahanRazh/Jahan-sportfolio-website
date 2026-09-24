'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Loader2, 
  Plus, 
  Check, 
  Image as ImageIcon 
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                GitHub / Repository URL
              </label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Live Demo URL
              </label>
              <input
                type="url"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleInputChange}
                placeholder="https://your-demo-url.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Row 6: Image Upload to Cloudinary */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Project Image (Cloudinary)
              </label>
              <span className="text-xs text-slate-400">JPG, PNG, GIF, WEBP up to 10MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview Box */}
              <div className="relative w-36 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
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
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
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
