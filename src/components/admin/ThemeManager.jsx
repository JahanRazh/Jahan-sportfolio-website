'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Eye,
  Layers,
  Zap,
  Globe,
  FileText,
  Bookmark,
  Award,
} from 'lucide-react';
import {
  CURATED_THEMES,
  DEFAULT_PORTFOLIO_THEME,
  subscribeToPortfolioTheme,
  updatePortfolioTheme,
  resetPortfolioTheme,
  applyThemeToDom,
} from '../../lib/firestore';
import { useToast } from '../Toast';

export default function ThemeManager() {
  const { addToast } = useToast();
  const [activeTheme, setActiveTheme] = useState(DEFAULT_PORTFOLIO_THEME);
  const [customPrimary, setCustomPrimary] = useState(DEFAULT_PORTFOLIO_THEME.primaryColor);
  const [customSecondary, setCustomSecondary] = useState(DEFAULT_PORTFOLIO_THEME.secondaryColor);
  const [customAccent, setCustomAccent] = useState(DEFAULT_PORTFOLIO_THEME.accentColor);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPortfolioTheme((theme) => {
      if (theme) {
        setActiveTheme(theme);
        setCustomPrimary(theme.primaryColor || '#12f7ff');
        setCustomSecondary(theme.secondaryColor || '#6e57e0');
        setCustomAccent(theme.accentColor || '#00c9ff');
      }
    });
    return () => unsub();
  }, []);

  const handleSelectCuratedTheme = async (preset) => {
    setSaving(true);
    const updated = {
      themeId: preset.id,
      themeName: preset.name,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      customEnabled: false,
    };

    // Immediate preview on DOM
    applyThemeToDom(updated);
    setActiveTheme(updated);
    setCustomPrimary(preset.primaryColor);
    setCustomSecondary(preset.secondaryColor);
    setCustomAccent(preset.accentColor);

    try {
      await updatePortfolioTheme(updated);
      addToast(`Theme "${preset.name}" applied across your whole portfolio!`, 'success');
    } catch (err) {
      console.error('Failed to update theme:', err);
      addToast('Failed to save theme to cloud.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCustomColors = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updated = {
      themeId: 'custom',
      themeName: 'Custom Brand Palette',
      primaryColor: customPrimary,
      secondaryColor: customSecondary,
      accentColor: customAccent,
      customEnabled: true,
    };

    applyThemeToDom(updated);
    setActiveTheme(updated);

    try {
      await updatePortfolioTheme(updated);
      addToast('Custom theme colors saved and applied live!', 'success');
    } catch (err) {
      console.error('Failed to update custom theme:', err);
      addToast('Failed to save custom colors.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setSaving(true);
    applyThemeToDom(DEFAULT_PORTFOLIO_THEME);
    setActiveTheme(DEFAULT_PORTFOLIO_THEME);
    setCustomPrimary(DEFAULT_PORTFOLIO_THEME.primaryColor);
    setCustomSecondary(DEFAULT_PORTFOLIO_THEME.secondaryColor);
    setCustomAccent(DEFAULT_PORTFOLIO_THEME.accentColor);

    try {
      await resetPortfolioTheme();
      addToast('Restored default Cyber Cyan & Electric Indigo theme.', 'success');
    } catch (err) {
      addToast('Failed to reset theme.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Overview Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-20"
          style={{ background: activeTheme.primaryColor }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${activeTheme.primaryColor}25, ${activeTheme.secondaryColor}25)`,
                borderColor: `${activeTheme.primaryColor}50`,
                boxShadow: `0 0 25px ${activeTheme.primaryColor}30`,
              }}
            >
              <Palette className="w-7 h-7" style={{ color: activeTheme.primaryColor }} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Portfolio Theme Studio
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold border"
                  style={{
                    background: `${activeTheme.primaryColor}15`,
                    color: activeTheme.primaryColor,
                    borderColor: `${activeTheme.primaryColor}40`,
                  }}
                >
                  Active: {activeTheme.themeName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Select from curated color aesthetics or create custom brand palettes. Changes instantly transform your entire portfolio website (headings, glow orbs, buttons, badges, navigation, and accents) in real time.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={saving || activeTheme.themeId === 'cyber_cyan'}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Cyber Theme</span>
          </button>
        </div>

        {/* Live Interactive Preview Box */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Live Component Preview (How Visitors See It)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              CSS Variables: --theme-primary, --theme-secondary
            </span>
          </div>

          <div
            className="rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(10, 14, 23, 0.95), rgba(15, 23, 42, 0.95))',
              borderColor: `${activeTheme.primaryColor}30`,
              boxShadow: `0 0 35px ${activeTheme.primaryColor}10`,
            }}
          >
            {/* Ambient orb */}
            <div
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-500"
              style={{ background: activeTheme.primaryColor }}
            />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              {/* Mockup Logo & Title */}
              <div>
                <div className="flex items-baseline mb-2">
                  <span
                    className="text-2xl font-black tracking-tight transition-colors duration-300"
                    style={{ color: activeTheme.primaryColor }}
                  >
                    Razh
                  </span>
                  <span
                    className="text-2xl font-black transition-colors duration-300"
                    style={{ color: activeTheme.secondaryColor }}
                  >
                    .
                  </span>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Preview
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>I'm</span>
                  <span
                    className="font-black transition-all duration-300 bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.secondaryColor})`,
                    }}
                  >
                    Full Stack Developer
                  </span>
                </h3>
              </div>

              {/* Mockup Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all shadow-lg hover:opacity-90"
                  style={{
                    backgroundColor: activeTheme.secondaryColor,
                    boxShadow: `0 0 20px ${activeTheme.secondaryColor}40`,
                  }}
                >
                  Hire Me
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all"
                  style={{
                    backgroundColor: `${activeTheme.primaryColor}15`,
                    color: activeTheme.primaryColor,
                    borderColor: `${activeTheme.primaryColor}40`,
                  }}
                >
                  <span>Download CV</span>
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mockup Tags Row */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium mr-1">Preview Badges:</span>
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1"
                style={{
                  background: `${activeTheme.primaryColor}15`,
                  color: activeTheme.primaryColor,
                  borderColor: `${activeTheme.primaryColor}30`,
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Engineering</span>
              </span>

              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1"
                style={{
                  background: `${activeTheme.secondaryColor}15`,
                  color: activeTheme.secondaryColor,
                  borderColor: `${activeTheme.secondaryColor}30`,
                }}
              >
                <Bookmark className="w-3 h-3" />
                <span>Next.js 14</span>
              </span>

              <span
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1"
                style={{
                  background: `${activeTheme.accentColor}15`,
                  color: activeTheme.accentColor,
                  borderColor: `${activeTheme.accentColor}30`,
                }}
              >
                <Award className="w-3 h-3" />
                <span>Certified Cloud Builder</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Theme Presets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Curated Theme Presets</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Professionally tuned harmonious palettes designed for high-contrast dark mode excellence.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CURATED_THEMES.map((theme) => {
            const isSelected = activeTheme.themeId === theme.id && !activeTheme.customEnabled;

            return (
              <div
                key={theme.id}
                className={`relative rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400/60 shadow-xl shadow-cyan-500/10 scale-[1.02]'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  {/* Category Pill & Selection Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {theme.category}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  {/* Gradient Strip */}
                  <div
                    className="h-3 rounded-full mb-3 shadow-inner"
                    style={{
                      background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.accentColor})`,
                    }}
                  />

                  {/* Theme Title */}
                  <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                    {theme.name}
                  </h4>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 inline-block shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                        title={`Primary: ${theme.primaryColor}`}
                      />
                      <span className="text-[10px] font-mono text-slate-400">{theme.primaryColor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 inline-block shadow-sm"
                        style={{ backgroundColor: theme.secondaryColor }}
                        title={`Secondary: ${theme.secondaryColor}`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 inline-block shadow-sm"
                        style={{ backgroundColor: theme.accentColor }}
                        title={`Accent: ${theme.accentColor}`}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {theme.description}
                  </p>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => handleSelectCuratedTheme(theme)}
                  disabled={saving || isSelected}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-white hover:border-slate-600 border border-slate-700 cursor-pointer'
                  }`}
                >
                  {isSelected ? 'Applied to Portfolio' : 'Apply This Theme'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Color Palette Studio */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Custom Brand Color Studio</h3>
            <p className="text-xs text-slate-400">
              Need custom brand hex codes? Pick your exact Primary, Secondary, and Accent colors below.
            </p>
          </div>
        </div>

        <form onSubmit={handleApplyCustomColors} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Primary Accent Color */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Primary Glow / Neon Accent
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-cyan-400"
                  placeholder="#12f7ff"
                />
              </div>
              <span className="text-[11px] text-slate-500 block">Used for neon highlights, badges, and active dots.</span>
            </div>

            {/* Secondary Brand Color */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Secondary Button / Gradient Base
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-cyan-400"
                  placeholder="#6e57e0"
                />
              </div>
              <span className="text-[11px] text-slate-500 block">Used for primary action buttons and gradient blends.</span>
            </div>

            {/* Third Accent Color */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Hover Accent & Icon Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-cyan-400"
                  placeholder="#00c9ff"
                />
              </div>
              <span className="text-[11px] text-slate-500 block">Used for card borders, hover states, and scrollbar.</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:opacity-95 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              <span>{saving ? 'Applying Custom Theme...' : 'Save & Apply Custom Colors'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
