'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, FileText } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import {
  subscribeToProfile,
  getCachedProfile,
  INITIAL_PROFILE,
  subscribeToSectionVisibility,
  getCachedSectionVisibility,
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_SECTION_ORDER,
} from '../lib/firestore';
import { getDirectDownloadUrl, downloadPdfDirectly } from '../lib/downloadHelper';

export default function Navbar({ initialVisibility }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [profile, setProfile] = useState(getCachedProfile);
  const [visibility, setVisibility] = useState(
    initialVisibility || getCachedSectionVisibility() || DEFAULT_SECTION_VISIBILITY
  );

  useEffect(() => {
    const unsub = subscribeToProfile((data) => {
      if (data) setProfile(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToSectionVisibility((data) => {
      if (data) setVisibility(data);
    });
    return () => unsub();
  }, []);

  const cvDownloadUrl = profile.cvUrl || '/assets/cv/Jahan_Jayalath-CV.pdf';
  const cvDownloadName = profile.cvFileName || 'Jahan_Jayalath_CV.pdf';

  const allNavLinksMap = {
    hero: { label: 'Home', href: '#home', id: 'home', sectionKey: 'hero' },
    about: { label: 'About', href: '#about', id: 'about', sectionKey: 'about' },
    services: { label: 'Services', href: '#services', id: 'services', sectionKey: 'services' },
    projects: { label: 'Projects', href: '#projects', id: 'projects', sectionKey: 'projects' },
    skills: { label: 'Skills', href: '#skills', id: 'skills', sectionKey: 'skills' },
    experience: { label: 'Experience', href: '#experience', id: 'experience', sectionKey: 'experience' },
    publications: { label: 'Research', href: '#publications', id: 'publications', sectionKey: 'publications' },
    certificates: { label: 'Certificates', href: '#certificates', id: 'certificates', sectionKey: 'certificates' },
    contact: { label: 'Contact', href: '#contact', id: 'contact', sectionKey: 'contact' },
  };

  const order = visibility.sectionOrder || DEFAULT_SECTION_ORDER;
  const navLinks = order
    .filter((key) => visibility[key] !== false && allNavLinksMap[key])
    .map((key) => allNavLinksMap[key]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const activeIds = navLinks.map((l) => l.id);
      for (const sectionId of activeIds) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navLinks]);

  return (
    <header
      id="header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'h-20 bg-white/80 dark:bg-[#0a0e17]/85 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-cyan-950/20 border-b border-slate-200/50 dark:border-slate-800/60'
          : 'h-24 bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 lg:gap-6">
        {/* Logo */}
        <Link href="#home" className="group flex items-baseline select-none shrink-0">
          <span
            className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-all group-hover:scale-105"
            style={{ color: 'var(--theme-primary, #12f7ff)' }}
          >
            Razh
          </span>
          <span
            className="text-3xl font-black transition-colors"
            style={{ color: 'var(--theme-secondary, #6e57e0)' }}
          >
            .
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                style={isActive ? { color: 'var(--theme-primary, #12f7ff)' } : {}}
                className={`relative px-2.5 py-1.5 xl:px-3.5 xl:py-2 text-xs xl:text-sm font-medium whitespace-nowrap rounded-full transition-all duration-300 ${
                  isActive
                    ? 'font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: 'var(--theme-primary, #12f7ff)' }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <a
            href={getDirectDownloadUrl(cvDownloadUrl, cvDownloadName)}
            download={cvDownloadName}
            onClick={(e) => {
              e.preventDefault();
              downloadPdfDirectly(cvDownloadUrl, cvDownloadName);
            }}
            id="nav-download-cv-btn"
            title="Download Jahan Jayalath CV (PDF)"
            className="inline-flex items-center gap-2 px-4 py-2 xl:px-5 xl:py-2.5 rounded-xl font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all duration-300 bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 hover:text-white border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-[0_0_20px_rgba(18,247,255,0.35)] hover:-translate-y-0.5 cursor-pointer group"
            style={{
              borderColor: 'var(--theme-primary, #12f7ff)40',
            }}
          >
            <span>Download CV</span>
            <FileText className="w-3.5 h-3.5 xl:w-4 xl:h-4 group-hover:-translate-y-0.5 transition-transform" />
          </a>
          <ThemeToggle />
        </div>

        {/* Mobile & Tablet Hamburger, Compact CV Button & Theme Toggle */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <a
            href={getDirectDownloadUrl(cvDownloadUrl, cvDownloadName)}
            download={cvDownloadName}
            onClick={(e) => {
              e.preventDefault();
              downloadPdfDirectly(cvDownloadUrl, cvDownloadName);
            }}
            id="nav-download-cv-btn-mobile"
            title="Download Jahan Jayalath CV (PDF)"
            aria-label="Download CV"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs whitespace-nowrap shrink-0 transition-all border shadow-sm cursor-pointer hover:text-white"
            style={{
              background: 'var(--theme-primary, #12f7ff)15',
              color: 'var(--theme-primary, #12f7ff)',
              borderColor: 'var(--theme-primary, #12f7ff)40',
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CV</span>
          </a>
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-20 left-0 right-0 bottom-0 bg-white/95 dark:bg-[#0a0e17]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/80 p-6 flex flex-col justify-between z-40 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-2 overflow-y-auto">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-base font-medium transition ${
                  activeSection === link.id
                    ? 'font-semibold bg-slate-800/70'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
                style={
                  activeSection === link.id
                    ? { color: 'var(--theme-primary, #12f7ff)' }
                    : {}
                }
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <a
              href={getDirectDownloadUrl(cvDownloadUrl, cvDownloadName)}
              download={cvDownloadName}
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                downloadPdfDirectly(cvDownloadUrl, cvDownloadName);
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-base whitespace-nowrap text-white hover:opacity-95 transition shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary, #12f7ff), var(--theme-secondary, #6e57e0))',
              }}
            >
              <FileText className="w-5 h-5" />
              <span>Download CV</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
