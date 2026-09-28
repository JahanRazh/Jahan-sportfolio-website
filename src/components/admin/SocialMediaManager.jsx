'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  ExternalLink,
  DatabaseBackup,
  GripVertical,
  LayoutTemplate,
  AlignJustify,
  AlertCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  Hash,
  Sparkles,
  Layers,
  ClipboardPaste,
  ListPlus,
  CheckCheck,
} from 'lucide-react';
import { useToast } from '../Toast';
import {
  subscribeToSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  bulkCreateSocialLinks,
  seedInitialSocialLinks,
  INITIAL_SOCIAL_LINKS,
} from '../../lib/firestore';

// ─── Platform presets with auto-detection patterns ────────────────────────────
export const PLATFORM_PRESETS = {
  github: {
    label: 'GitHub',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/github.svg',
    color: 'bg-slate-600/20 text-slate-300 border-slate-500/30',
    patterns: [/github\.com/i],
    defaultUrl: 'https://github.com/',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg',
    color: 'bg-blue-700/20 text-blue-200 border-blue-600/30',
    patterns: [/linkedin\.com/i],
    defaultUrl: 'https://linkedin.com/in/',
  },
  facebook: {
    label: 'Facebook',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/facebook.svg',
    color: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    patterns: [/facebook\.com/i, /fb\.com/i, /fb\.me/i],
    defaultUrl: 'https://facebook.com/',
  },
  instagram: {
    label: 'Instagram',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg',
    color: 'bg-pink-600/20 text-pink-300 border-pink-500/30',
    patterns: [/instagram\.com/i, /instagr\.am/i],
    defaultUrl: 'https://instagram.com/',
  },
  twitter: {
    label: 'Twitter / X',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/twitter.svg',
    color: 'bg-sky-600/20 text-sky-300 border-sky-500/30',
    patterns: [/twitter\.com/i, /x\.com/i],
    defaultUrl: 'https://x.com/',
  },
  youtube: {
    label: 'YouTube',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/youtube.svg',
    color: 'bg-red-600/20 text-red-300 border-red-500/30',
    patterns: [/youtube\.com/i, /youtu\.be/i],
    defaultUrl: 'https://youtube.com/',
  },
  discord: {
    label: 'Discord',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/discord.svg',
    color: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30',
    patterns: [/discord\.(gg|com)/i],
    defaultUrl: 'https://discord.gg/',
  },
  stackoverflow: {
    label: 'Stack Overflow',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/stack-overflow.svg',
    color: 'bg-orange-600/20 text-orange-300 border-orange-500/30',
    patterns: [/stackoverflow\.com/i],
    defaultUrl: 'https://stackoverflow.com/users/',
  },
  hackerrank: {
    label: 'HackerRank',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/hackerrank.svg',
    color: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
    patterns: [/hackerrank\.com/i],
    defaultUrl: 'https://hackerrank.com/',
  },
  gitlab: {
    label: 'GitLab',
    icon: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/gitlab.svg',
    color: 'bg-orange-600/20 text-orange-300 border-orange-500/30',
    patterns: [/gitlab\.com/i],
    defaultUrl: 'https://gitlab.com/',
  },
  medium: {
    label: 'Medium',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/medium.svg',
    color: 'bg-stone-600/20 text-stone-300 border-stone-500/30',
    patterns: [/medium\.com/i],
    defaultUrl: 'https://medium.com/@',
  },
  telegram: {
    label: 'Telegram',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/telegram.svg',
    color: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
    patterns: [/t\.me/i, /telegram\.me/i, /telegram\.org/i],
    defaultUrl: 'https://t.me/',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/whatsapp.svg',
    color: 'bg-green-600/20 text-green-300 border-green-500/30',
    patterns: [/wa\.me/i, /whatsapp\.com/i],
    defaultUrl: 'https://wa.me/',
  },
  threads: {
    label: 'Threads',
    icon: 'https://cdn.simpleicons.org/threads/ffffff',
    color: 'bg-zinc-700/20 text-zinc-200 border-zinc-600/30',
    patterns: [/threads\.net/i],
    defaultUrl: 'https://threads.net/@',
  },
  dribbble: {
    label: 'Dribbble',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/dribbble.svg',
    color: 'bg-pink-700/20 text-pink-300 border-pink-600/30',
    patterns: [/dribbble\.com/i],
    defaultUrl: 'https://dribbble.com/',
  },
  behance: {
    label: 'Behance',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/behance.svg',
    color: 'bg-blue-800/20 text-blue-200 border-blue-700/30',
    patterns: [/behance\.net/i],
    defaultUrl: 'https://behance.net/',
  },
  other: {
    label: 'Other',
    icon: '',
    color: 'bg-slate-600/20 text-slate-300 border-slate-500/30',
    patterns: [],
    defaultUrl: '',
  },
};

/**
 * Automatically detects platform key from a given profile URL
 */
export function detectPlatformFromUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = rawUrl.trim().toLowerCase();
  for (const [key, preset] of Object.entries(PLATFORM_PRESETS)) {
    if (key === 'other') continue;
    if (preset.patterns && preset.patterns.some((pattern) => pattern.test(cleanUrl))) {
      return key;
    }
  }
  return null;
}

const EMPTY_FORM = {
  name: '',
  url: '',
  icon: '',
  platform: 'other',
  showInHero: true,
  showInFooter: false,
  order: 1,
  published: true,
};

// ─── Form Modal ──────────────────────────────────────────────────────────────
function SocialLinkFormModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detectedBadge, setDetectedBadge] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initial ? { ...EMPTY_FORM, ...initial } : { ...EMPTY_FORM });
      setDetectedBadge(null);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  // Handle typing or pasting into Profile URL -> auto-detect platform, name & icon
  const handleUrlChange = (value) => {
    const detected = detectPlatformFromUrl(value);

    if (detected && detected !== 'other') {
      const preset = PLATFORM_PRESETS[detected];
      setDetectedBadge(preset.label);

      setForm((prev) => {
        const isPresetName = Object.values(PLATFORM_PRESETS).some((p) => p.label === prev.name);
        const isPresetIcon = Object.values(PLATFORM_PRESETS).some((p) => p.icon && p.icon === prev.icon);

        return {
          ...prev,
          url: value,
          platform: detected,
          // Auto-fill Display Name if empty or if currently matches a known preset name
          name: (!prev.name.trim() || isPresetName) ? preset.label : prev.name,
          // Auto-fill Icon URL if empty or if currently matches a known preset icon
          icon: (!prev.icon.trim() || isPresetIcon) ? preset.icon : prev.icon,
        };
      });
    } else {
      setDetectedBadge(null);
      setForm((prev) => ({ ...prev, url: value }));
    }
  };

  // Handle clicking a platform button
  const handlePlatformChange = (platform) => {
    const preset = PLATFORM_PRESETS[platform];
    setDetectedBadge(null);

    setForm((prev) => {
      const isPresetName = Object.values(PLATFORM_PRESETS).some((p) => p.label === prev.name);
      const isPresetIcon = Object.values(PLATFORM_PRESETS).some((p) => p.icon && p.icon === prev.icon);

      const updates = {
        ...prev,
        platform,
        name: (!prev.name.trim() || isPresetName) ? (preset?.label || prev.name) : prev.name,
        icon: (!prev.icon.trim() || isPresetIcon || !prev.icon) ? (preset?.icon || '') : prev.icon,
      };

      // If URL is currently empty, pre-fill platform default URL prefix as a helpful starter
      if (!prev.url.trim() && preset?.defaultUrl) {
        updates.url = preset.defaultUrl;
      }

      return updates;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.url.trim()) return;

    // Automatically prepend https:// if protocol was omitted
    let finalUrl = form.url.trim();
    if (
      !/^https?:\/\//i.test(finalUrl) &&
      !/^mailto:/i.test(finalUrl) &&
      !/^tel:/i.test(finalUrl)
    ) {
      finalUrl = `https://${finalUrl}`;
    }

    setSaving(true);
    try {
      await onSave({ ...form, url: finalUrl });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {initial ? 'Edit Social Link' : 'Add Social Link'}
              </h2>
              <p className="text-xs text-slate-400">
                Paste your Profile URL below to auto-fill platform, name & icon.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Profile URL (Primary Input) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Profile URL *
              </label>
              {detectedBadge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Auto-detected: {detectedBadge}
                </span>
              )}
            </div>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="e.g. https://github.com/yourname or linkedin.com/in/yourname"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition font-mono text-xs"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              💡 Tip: Paste your profile URL and we will automatically detect the Platform, Display Name & Icon.
            </p>
          </div>

          {/* Platform selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Platform
              </label>
              <span className="text-[11px] text-slate-500">
                Selected: <strong className="text-cyan-300 capitalize">{form.platform}</strong>
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800/80">
              {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePlatformChange(key)}
                  title={preset.label}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition ${form.platform === key
                      ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300 font-bold shadow-sm shadow-cyan-500/20'
                      : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 bg-slate-900/60'
                    }`}
                >
                  {preset.icon ? (
                    <img src={preset.icon} alt={preset.label} className="w-4 h-4 object-contain" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  <span className="truncate w-full text-center">
                    {key === 'stackoverflow' ? 'S.O.' : key === 'hackerrank' ? 'H.R.' : preset.label.split('/')[0].trim()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Display Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. GitHub"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 transition"
            />
          </div>

          {/* Icon URL (auto-filled from platform) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Icon URL <span className="text-slate-500 normal-case font-normal">(auto-filled from platform)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                {form.icon ? (
                  <img src={form.icon} alt="icon preview" className="w-5 h-5 object-contain" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <input
                type="url"
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                placeholder="https://raw.githubusercontent.com/.../icon.svg"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/60 transition font-mono"
              />
            </div>
          </div>

          {/* Order + Visibility row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min="1"
                value={form.order}
                onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500/60 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Visibility Status
              </label>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, published: !p.published }))}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition ${form.published
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
              >
                {form.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {form.published ? 'Published' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Placement toggles */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Show in Sections
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, showInHero: !p.showInHero }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition ${form.showInHero
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
              >
                {form.showInHero ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                Hero Section
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, showInFooter: !p.showInFooter }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition ${form.showInFooter
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
              >
                {form.showInFooter ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                Footer
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving…' : initial ? 'Update Link' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────
function BulkSocialLinksModal({ isOpen, onClose, onBulkSave, currentCount = 0 }) {
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [globalHero, setGlobalHero] = useState(true);
  const [globalFooter, setGlobalFooter] = useState(true);

  const parseLinks = (text, heroSetting = true, footerSetting = true) => {
    if (!text || !text.trim()) {
      setParsedItems([]);
      return;
    }

    const lines = text.split(/[\r\n,;]+/);
    const results = [];
    const seenUrls = new Set();

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const urlMatches = trimmed.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s,'"<>)]*)?/gi);
      if (urlMatches) {
        urlMatches.forEach((matchedUrl) => {
          let cleanUrl = matchedUrl.replace(/[.,;)]+$/, '');
          if (!/^https?:\/\//i.test(cleanUrl) && !/^mailto:/i.test(cleanUrl) && !/^tel:/i.test(cleanUrl)) {
            cleanUrl = `https://${cleanUrl}`;
          }

          if (!seenUrls.has(cleanUrl)) {
            seenUrls.add(cleanUrl);
            const detected = detectPlatformFromUrl(cleanUrl);
            const preset = detected ? PLATFORM_PRESETS[detected] : PLATFORM_PRESETS.other;

            results.push({
              tempId: `${Date.now()}-${results.length}`,
              url: cleanUrl,
              platform: detected || 'other',
              name: preset?.label || 'Link',
              icon: preset?.icon || '',
              showInHero: heroSetting,
              showInFooter: footerSetting,
              order: currentCount + results.length + 1,
              published: true,
            });
          }
        });
      }
    });

    setParsedItems(results);
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setRawText(text);
    parseLinks(text, globalHero, globalFooter);
  };

  const handleToggleGlobalHero = (val) => {
    setGlobalHero(val);
    setParsedItems((prev) => prev.map((item) => ({ ...item, showInHero: val })));
  };

  const handleToggleGlobalFooter = (val) => {
    setGlobalFooter(val);
    setParsedItems((prev) => prev.map((item) => ({ ...item, showInFooter: val })));
  };

  const handleItemNameChange = (index, newName) => {
    setParsedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const handleItemToggleHero = (index) => {
    setParsedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], showInHero: !next[index].showInHero };
      return next;
    });
  };

  const handleItemToggleFooter = (index) => {
    setParsedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], showInFooter: !next[index].showInFooter };
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadSample = () => {
    const sample = `https://github.com/JahanRazh\nhttps://linkedin.com/in/jahan-razh\nhttps://instagram.com/_jahan_razh_\nhttps://facebook.com/rjahan.razh\nhttps://youtube.com/@channel\nhttps://x.com/jahan3165`;
    setRawText(sample);
    parseLinks(sample, globalHero, globalFooter);
  };

  const handleClear = () => {
    setRawText('');
    setParsedItems([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedItems.length === 0) return;
    setSaving(true);
    try {
      await onBulkSave(parsedItems);
      onClose();
      handleClear();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Bulk Paste Social Links
              </h2>
              <p className="text-xs text-slate-400">
                Paste all your social links at once — platforms, names & icons are auto-detected instantly.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 flex flex-col">
          {/* Textarea for bulk paste */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardPaste className="w-3.5 h-3.5 text-cyan-400" />
                Paste Profile Links
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Load Sample
                </button>
                {rawText && (
                  <>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={rawText}
              onChange={handleTextChange}
              placeholder={`Paste multiple links here (one per line, comma separated, or any text)...
https://github.com/yourprofile
https://linkedin.com/in/yourprofile
https://instagram.com/yourprofile
https://facebook.com/yourprofile
https://x.com/yourprofile`}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition resize-y"
            />
          </div>

          {/* Global placement toolbar */}
          {parsedItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">
                  {parsedItems.length} {parsedItems.length === 1 ? 'Link' : 'Links'} Detected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Apply to all:
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleGlobalHero(!globalHero)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${globalHero
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                >
                  Hero {globalHero ? '✓ ON' : '✕ OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGlobalFooter(!globalFooter)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${globalFooter
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                >
                  Footer {globalFooter ? '✓ ON' : '✕ OFF'}
                </button>
              </div>
            </div>
          )}

          {/* Parsed items preview list */}
          {parsedItems.length > 0 ? (
            <div className="space-y-2 flex-1 max-h-60 overflow-y-auto pr-1">
              {parsedItems.map((item, index) => {
                const preset = PLATFORM_PRESETS[item.platform] || PLATFORM_PRESETS.other;
                return (
                  <div
                    key={item.tempId || index}
                    className="flex items-center gap-3 p-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl hover:border-slate-600 transition"
                  >
                    {/* Platform icon */}
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                      {item.icon ? (
                        <img src={item.icon} alt={item.name} className="w-4 h-4 object-contain" />
                      ) : (
                        <Globe className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    {/* Display name input */}
                    <div className="w-28 shrink-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemNameChange(index, e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:outline-none focus:border-cyan-500/60"
                        placeholder="Name"
                      />
                    </div>

                    {/* URL */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-300 hover:text-cyan-300 font-mono truncate block"
                        title={item.url}
                      >
                        {item.url}
                      </a>
                    </div>

                    {/* Hero toggle pill */}
                    <button
                      type="button"
                      onClick={() => handleItemToggleHero(index)}
                      title="Toggle Hero section"
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${item.showInHero
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-900 border-slate-700 text-slate-600'
                        }`}
                    >
                      Hero
                    </button>

                    {/* Footer toggle pill */}
                    <button
                      type="button"
                      onClick={() => handleItemToggleFooter(index)}
                      title="Toggle Footer"
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${item.showInFooter
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-700 text-slate-600'
                        }`}
                    >
                      Footer
                    </button>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      title="Remove from batch"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : rawText.trim() ? (
            <div className="py-6 text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              No valid URLs detected in the pasted text. Please check the format.
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 shrink-0 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || parsedItems.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving {parsedItems.length} Links…</span>
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>
                    {parsedItems.length > 0
                      ? `Import & Save All (${parsedItems.length}) Links`
                      : 'Paste Links to Import'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteModal({ link, onConfirm, onClose, deleting }) {
  if (!link) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Delete Social Link?</h3>
        <p className="text-sm text-slate-400 mb-6">
          <span className="text-white font-semibold">{link.name}</span> will be removed from the live site immediately.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SocialMediaManager({ links = [], loading = false }) {
  const { addToast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const handleBulkSave = async (items) => {
    try {
      await bulkCreateSocialLinks(items);
      addToast(`Successfully added ${items.length} social link${items.length > 1 ? 's' : ''}!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save bulk links', 'error');
      throw err;
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingLink?.id) {
        await updateSocialLink(editingLink.id, formData);
        addToast(`${formData.name} updated successfully!`, 'success');
      } else {
        await createSocialLink(formData);
        addToast(`${formData.name} added to your portfolio!`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to save social link', 'error');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSocialLink(deleteTarget.id);
      addToast(`${deleteTarget.name} removed from portfolio`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      addToast(err.message || 'Failed to delete link', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (link) => {
    setTogglingId(link.id);
    try {
      await updateSocialLink(link.id, { ...link, published: !link.published });
      addToast(`${link.name} ${!link.published ? 'published live' : 'hidden from site'}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedInitialSocialLinks();
      addToast('All 9 default social links seeded to Firestore!', 'success');
    } catch (err) {
      addToast(err.message || 'Seed failed', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const heroLinks = links.filter((l) => l.showInHero && l.published);
  const footerLinks = links.filter((l) => l.showInFooter && l.published);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Social Media Links</h2>
              <p className="text-xs text-slate-400">Manage links shown in Hero section and Footer</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {links.length === 0 && !loading && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition disabled:opacity-60"
              >
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DatabaseBackup className="w-3.5 h-3.5" />}
                Seed Defaults
              </button>
            )}
            <button
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 text-sm font-semibold transition shadow-sm"
              title="Paste multiple links at once"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Bulk Paste Links</span>
            </button>
            <button
              onClick={() => { setEditingLink(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition shadow-md shadow-cyan-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Live preview pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <LayoutTemplate className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Hero Section</span>
              <span className="ml-auto text-xs text-indigo-300 font-bold">{heroLinks.length} links</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {heroLinks.length > 0 ? heroLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.name}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-indigo-400 hover:scale-110 transition duration-200"
                >
                  {link.icon ? (
                    <img src={link.icon} alt={link.name} className="w-4 h-4 object-contain" />
                  ) : (
                    <Globe className="w-4 h-4 text-slate-400" />
                  )}
                </a>
              )) : (
                <p className="text-xs text-slate-500 italic">No Hero links enabled</p>
              )}
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlignJustify className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Footer</span>
              <span className="ml-auto text-xs text-cyan-300 font-bold">{footerLinks.length} links</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {footerLinks.length > 0 ? footerLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.name}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-cyan-400 hover:scale-110 transition duration-200"
                >
                  {link.icon ? (
                    <img src={link.icon} alt={link.name} className="w-4 h-4 object-contain" />
                  ) : (
                    <Globe className="w-4 h-4 text-slate-400" />
                  )}
                </a>
              )) : (
                <p className="text-xs text-slate-500 italic">No Footer links enabled</p>
              )}
            </div>
          </div>
        </div>

        {/* Links table */}
        {loading ? (
          <div className="p-16 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading social links…</p>
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex flex-col items-center text-center gap-4">
            <DatabaseBackup className="w-10 h-10 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white mb-1">No social links yet</h3>
              <p className="text-sm text-slate-400">Seed your default social links or add them manually.</p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition disabled:opacity-60"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseBackup className="w-4 h-4" />}
              Seed 9 Default Links
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <div className="col-span-1" />
              <div className="col-span-4">Platform / Name</div>
              <div className="col-span-3 hidden sm:block">URL</div>
              <div className="col-span-2 text-center hidden md:block">Placement</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800">
              {links.map((link) => {
                const preset = PLATFORM_PRESETS[link.platform] || PLATFORM_PRESETS.other;
                const isToggling = togglingId === link.id;
                return (
                  <div key={link.id} className={`grid grid-cols-12 gap-3 px-5 py-4 items-center transition hover:bg-slate-800/40 ${!link.published ? 'opacity-50' : ''}`}>
                    {/* Icon */}
                    <div className="col-span-1">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        {link.icon ? (
                          <img src={link.icon} alt={link.name} className="w-5 h-5 object-contain" />
                        ) : (
                          <Globe className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Name + platform badge */}
                    <div className="col-span-5 sm:col-span-4">
                      <p className="text-sm font-semibold text-white truncate">{link.name}</p>
                      <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${preset.color}`}>
                        {link.platform}
                      </span>
                    </div>

                    {/* URL */}
                    <div className="col-span-3 hidden sm:block">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 truncate group"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                      </a>
                    </div>

                    {/* Placement badges */}
                    <div className="col-span-2 hidden md:flex items-center justify-center gap-1.5">
                      {link.showInHero && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold">Hero</span>
                      )}
                      {link.showInFooter && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">Footer</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-1.5">
                      {/* Publish toggle */}
                      <button
                        onClick={() => handleTogglePublish(link)}
                        disabled={isToggling}
                        title={link.published ? 'Hide from site' : 'Publish to site'}
                        className={`p-1.5 rounded-lg border transition text-xs ${link.published
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : link.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => { setEditingLink(link); setIsFormOpen(true); }}
                        title="Edit"
                        className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(link)}
                        title="Delete"
                        className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer note */}
        {links.length > 0 && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Changes are <strong className="text-cyan-300">live instantly</strong> on your portfolio — both Hero section icons and Footer icons update in real-time via Firestore.
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      <BulkSocialLinksModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onBulkSave={handleBulkSave}
        currentCount={links.length}
      />
      <SocialLinkFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingLink(null); }}
        onSave={handleSave}
        initial={editingLink}
      />
      <DeleteModal
        link={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </>
  );
}
