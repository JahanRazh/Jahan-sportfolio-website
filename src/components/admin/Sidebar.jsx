'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FolderGit2, 
  PlusCircle, 
  Globe, 
  LogOut, 
  DatabaseBackup,
  Award,
  Sliders,
  User,
  X 
} from 'lucide-react';
import { INITIAL_PROFILE } from '../../lib/firestore';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onSeedData,
  onLogout,
  mobileOpen,
  setMobileOpen,
  userEmail,
  profileImageUrl,
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects Management', icon: FolderGit2 },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'skills', label: 'Skills (Tech & Pro)', icon: Sliders },
    { id: 'about', label: 'Profile Picture & CV', icon: User },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-300 p-5">
      <div>
        {/* Brand header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
          <div className="flex items-baseline select-none">
            <span className="text-2xl font-black text-cyan-400">Razh</span>
            <span className="text-2xl font-black text-indigo-500">.</span>
            <span className="ml-2 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CMS
            </span>
          </div>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Card with Real Profile Picture */}
        <button
          onClick={() => handleNavClick('about')}
          className="w-full mb-6 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 flex items-center gap-3 transition group text-left"
          title="Click to edit profile picture & details"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500/50 group-hover:border-cyan-400 shrink-0 bg-slate-950 transition">
            <img
              src={profileImageUrl || INITIAL_PROFILE.profileImageUrl}
              alt="Admin Profile"
              className="w-full h-full object-cover select-none"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Admin Profile</span>
              <span className="text-[10px] text-cyan-400 group-hover:underline font-semibold">Edit</span>
            </p>
            <p className="text-xs font-semibold text-slate-200 truncate">{userEmail || 'Admin'}</p>
          </div>
        </button>

        {/* Add Project CTA Button */}
        <button
          onClick={() => {
            onOpenAddModal();
            if (setMobileOpen) setMobileOpen(false);
          }}
          className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-600/30 transition duration-200"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Project</span>
        </button>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-cyan-300 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Seed Initial Data */}
          <button
            onClick={() => {
              onSeedData();
              if (setMobileOpen) setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/70 hover:text-amber-300 transition-all text-left"
          >
            <DatabaseBackup className="w-5 h-5 text-amber-400/80" />
            <span>Seed 6 Projects</span>
          </button>
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="pt-6 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition"
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>View Live Site</span>
        </Link>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
