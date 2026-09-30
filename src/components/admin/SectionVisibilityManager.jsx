'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Sparkles,
  User,
  Wrench,
  FolderGit2,
  Sliders,
  Briefcase,
  BookOpen,
  Award,
  Mail,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  subscribeToSectionVisibility,
  updateSectionVisibility,
  updateAllSectionsVisibility,
  updateSectionOrder,
  resetSectionSettings,
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_SECTION_ORDER,
} from '../../lib/firestore';
import { useToast } from '../Toast';

const SECTION_CONFIGS = [
  {
    key: 'hero',
    name: 'Hero & Intro Banner',
    anchor: '#home',
    icon: Sparkles,
    color: 'from-cyan-500/20 to-teal-500/10 text-cyan-400 border-cyan-500/30',
    description: 'Header greeting, dynamic typing roles, profile avatar with glow, direct CV download, and social link ecosystem.',
  },
  {
    key: 'about',
    name: 'About Me & Bio',
    anchor: '#about',
    icon: User,
    color: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Professional introduction, biography paragraphs, personal metrics, and frontend/backend/database stack pills.',
  },
  {
    key: 'services',
    name: 'Services Showcase',
    anchor: '#services',
    icon: Wrench,
    color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    description: 'Services provided including Web Development, Mobile Applications, and UI/UX Design with detailed service cards.',
  },
  {
    key: 'projects',
    name: 'Projects Showcase',
    anchor: '#projects',
    icon: FolderGit2,
    color: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30',
    description: 'Full portfolio projects grid with category filters, GitHub AI auto-extracted summaries, tech pills, and demo links.',
  },
  {
    key: 'skills',
    name: 'Technical & Professional Skills',
    anchor: '#skills',
    icon: Sliders,
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Proficiency progress bars for technical programming languages and circular radial meters for professional competencies.',
  },
  {
    key: 'experience',
    name: 'Experience & Education Timeline',
    anchor: '#experience',
    icon: Briefcase,
    color: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/30',
    description: 'Split and tabbed timeline of industry software engineering experience and SLIIT academic degree qualifications.',
  },
  {
    key: 'publications',
    name: 'Research & Publications',
    anchor: '#publications',
    icon: BookOpen,
    color: 'from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/30',
    description: 'Peer-reviewed academic papers, IEEE conference proceedings, expandable abstracts, author highlighting, and 1-click citation.',
  },
  {
    key: 'certificates',
    name: 'Certificates & Digital Badges',
    anchor: '#certificates',
    icon: Award,
    color: 'from-rose-500/20 to-amber-500/10 text-rose-400 border-rose-500/30',
    description: 'Full-resolution certificate document viewer with zoom controls and verified Open Badges from Parchment & Credly.',
  },
  {
    key: 'contact',
    name: 'Contact & Inquiry Form',
    anchor: '#contact',
    icon: Mail,
    color: 'from-emerald-500/20 to-cyan-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Interactive contact form integrated with EmailJS, direct email/phone cards, WhatsApp quick chat, and location.',
  },
];

const SECTION_CONFIG_MAP = SECTION_CONFIGS.reduce((acc, config) => {
  acc[config.key] = config;
  return acc;
}, {});

export default function SectionVisibilityManager() {
  const { addToast } = useToast();
  const [visibility, setVisibility] = useState({
    ...DEFAULT_SECTION_VISIBILITY,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  });
  const [updatingKey, setUpdatingKey] = useState(null);
  const [batchUpdating, setBatchUpdating] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSectionVisibility((data) => {
      if (data) setVisibility(data);
    });
    return () => unsub();
  }, []);

  const totalSections = SECTION_CONFIGS.length;
  const visibleCount = SECTION_CONFIGS.filter((s) => visibility[s.key] !== false).length;
  const hiddenCount = totalSections - visibleCount;

  const currentOrder = visibility.sectionOrder || DEFAULT_SECTION_ORDER;
  const orderedConfigs = currentOrder
    .map((key) => SECTION_CONFIG_MAP[key])
    .filter(Boolean);

  const handleToggle = async (sectionKey, sectionName) => {
    const nextState = visibility[sectionKey] === false;
    setUpdatingKey(sectionKey);

    // Optimistic UI update
    setVisibility((prev) => ({ ...prev, [sectionKey]: nextState }));

    try {
      await updateSectionVisibility(sectionKey, nextState);
      addToast(
        nextState
          ? `"${sectionName}" is now VISIBLE on your portfolio.`
          : `"${sectionName}" is now HIDDEN from your portfolio.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to update section visibility:', err);
      setVisibility((prev) => ({ ...prev, [sectionKey]: !nextState }));
      addToast('Failed to update visibility. Check connection.', 'error');
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleMove = async (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, movedItem);

    // Optimistic UI update
    setVisibility((prev) => ({ ...prev, sectionOrder: newOrder }));

    const itemConfig = SECTION_CONFIG_MAP[movedItem];
    try {
      await updateSectionOrder(newOrder);
      addToast(
        `Moved "${itemConfig?.name || movedItem}" to position #${targetIndex + 1}.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to update section order:', err);
      setVisibility((prev) => ({ ...prev, sectionOrder: currentOrder }));
      addToast('Failed to update section order. Check connection.', 'error');
    }
  };

  const handleShowAll = async () => {
    setBatchUpdating(true);
    const allVisible = {
      hero: true,
      about: true,
      services: true,
      projects: true,
      skills: true,
      experience: true,
      publications: true,
      certificates: true,
      contact: true,
    };
    setVisibility((prev) => ({ ...prev, ...allVisible }));
    try {
      await updateAllSectionsVisibility(allVisible);
      addToast('All portfolio sections are now visible.', 'success');
    } catch (err) {
      addToast('Failed to update sections.', 'error');
    } finally {
      setBatchUpdating(false);
    }
  };

  const handleResetOrder = async () => {
    setBatchUpdating(true);
    setVisibility((prev) => ({ ...prev, sectionOrder: [...DEFAULT_SECTION_ORDER] }));
    try {
      await updateSectionOrder([...DEFAULT_SECTION_ORDER]);
      addToast('Section order reset to default top-to-bottom layout.', 'success');
    } catch (err) {
      addToast('Failed to reset section order.', 'error');
    } finally {
      setBatchUpdating(false);
    }
  };

  const handleResetDefaults = async () => {
    setBatchUpdating(true);
    const resetData = {
      ...DEFAULT_SECTION_VISIBILITY,
      sectionOrder: [...DEFAULT_SECTION_ORDER],
    };
    setVisibility(resetData);
    try {
      await resetSectionSettings();
      addToast('Reset all section visibility and order to defaults.', 'success');
    } catch (err) {
      addToast('Failed to reset sections.', 'error');
    } finally {
      setBatchUpdating(false);
    }
  };

  const isCustomOrder = JSON.stringify(currentOrder) !== JSON.stringify(DEFAULT_SECTION_ORDER);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Portfolio Section Visibility & Order
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {visibleCount} of {totalSections} Visible
                </span>
                {isCustomOrder && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Custom Order Active
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Show, hide, or rearrange the layout order of any section on your portfolio. Changes update the public homepage, navigation bar links, and mobile drawer in real-time with zero redeployment.
              </p>
            </div>
          </div>

          {/* Batch Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShowAll}
              disabled={batchUpdating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show All</span>
            </button>
            <button
              type="button"
              onClick={handleResetOrder}
              disabled={batchUpdating || !isCustomOrder}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition disabled:opacity-50"
              title="Reset sections to default top-to-bottom order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Reset Order</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={batchUpdating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Active Sections
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-emerald-400">{visibleCount}</span>
              <span className="text-xs text-emerald-500/80 font-medium">Live on portfolio</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Hidden Sections
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-amber-400">{hiddenCount}</span>
              <span className="text-xs text-amber-500/80 font-medium">Hidden from public</span>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Layout Order Flow
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-300 font-semibold">
                {isCustomOrder ? 'Custom sequence' : 'Default layout flow'}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Flow Mini-Map */}
        <div className="mt-5 pt-5 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
            Live Page Top-to-Bottom Flow:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {orderedConfigs.map((section, idx) => {
              const isVisible = visibility[section.key] !== false;
              return (
                <React.Fragment key={section.key}>
                  {idx > 0 && <span className="text-slate-600 font-bold">➔</span>}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border transition ${
                      isVisible
                        ? 'bg-slate-800/90 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-950/40 text-slate-500 border-slate-800 line-through'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                    <span>{section.name.split(' ')[0]}</span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sections Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orderedConfigs.map((section, index) => {
          const isVisible = visibility[section.key] !== false;
          const Icon = section.icon;
          const isUpdating = updatingKey === section.key;

          const isFirst = index === 0;
          const isLast = index === orderedConfigs.length - 1;

          return (
            <div
              key={section.key}
              className={`group relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between ${
                isVisible
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg shadow-black/20'
                  : 'bg-slate-950/60 border-slate-800/50 opacity-80'
              }`}
            >
              <div>
                {/* Header: Order badge, Icon, Anchor, Reorder Buttons & Toggle Switch */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Position Number Pill */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 text-xs font-black text-white flex items-center justify-center shadow-inner">
                        #{index + 1}
                      </span>
                    </div>

                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr border flex items-center justify-center shrink-0 ${section.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {section.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-500">
                        {section.anchor}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isVisible}
                    disabled={isUpdating}
                    onClick={() => handleToggle(section.key, section.name)}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      isVisible ? 'bg-cyan-500' : 'bg-slate-700'
                    } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                    title={isVisible ? 'Click to hide this section' : 'Click to show this section'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isVisible ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {section.description}
                </p>
              </div>

              {/* Card Footer: Reorder Controls, Status Badge & Preview */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs">
                {/* Reorder Buttons Bar */}
                <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-medium text-slate-400 pl-1">
                    Display Position:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={isFirst}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs bg-slate-800 hover:bg-cyan-500 hover:text-white text-slate-300 border border-slate-700/80 disabled:opacity-30 disabled:pointer-events-none transition"
                      title={isFirst ? 'Already at the top' : `Move "${section.name}" up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Up</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={isLast}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs bg-slate-800 hover:bg-cyan-500 hover:text-white text-slate-300 border border-slate-700/80 disabled:opacity-30 disabled:pointer-events-none transition"
                      title={isLast ? 'Already at the bottom' : `Move "${section.name}" down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Down</span>
                    </button>
                  </div>
                </div>

                {/* Status & Preview Link */}
                <div className="flex items-center justify-between pt-1">
                  {isVisible ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Visible</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hidden</span>
                    </span>
                  )}

                  {isVisible ? (
                    <a
                      href={`/${section.anchor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 font-medium transition"
                    >
                      <span>View Section</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-600 font-medium">Excluded from page</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helpful Hint Callout */}
      <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 flex items-start gap-3 text-xs text-cyan-200/90 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-300 font-semibold block mb-0.5">
            How Section Ordering & Visibility Works
          </strong>
          Use the <span className="text-cyan-300 font-bold">Up</span> and <span className="text-cyan-300 font-bold">Down</span> buttons on any card to rearrange your sections. The public portfolio homepage, top Navbar links, and mobile drawer automatically reorder in that exact sequence in real-time.
        </div>
      </div>
    </div>
  );
}
