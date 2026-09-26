'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, FileText } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { subscribeToProfile, getCachedProfile, INITIAL_PROFILE } from '../lib/firestore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [profile, setProfile] = useState(getCachedProfile);

  useEffect(() => {
    const unsub = subscribeToProfile((data) => {
      if (data) setProfile(data);
    });
    return () => unsub();
  }, []);

  const cvDownloadUrl = profile.cvUrl || '/assets/cv/Jahan_Jayalath-CV.pdf';
  const cvDownloadName = profile.cvFileName || 'Jahan_Jayalath_CV.pdf';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const sections = ['home', 'about', 'services', 'projects', 'skills', 'certificates', 'contact'];
      for (const sectionId of sections) {
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
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Services', href: '#services', id: 'services' },
    { label: 'Projects', href: '#projects', id: 'projects' },
    { label: 'Skills', href: '#skills', id: 'skills' },
    { label: 'Certificates', href: '#certificates', id: 'certificates' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  return (
    <header
      id="header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'h-20 bg-white/80 dark:bg-[#0a0e17]/85 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-cyan-950/20 border-b border-slate-200/50 dark:border-slate-800/60'
          : 'h-24 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-6 sm:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="#home" className="group flex items-baseline select-none">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1e9fab] dark:text-[#12f7ff] transition-all group-hover:scale-105">
            Razh
          </span>
          <span className="text-3xl font-black text-[#6e57e0] dark:text-[#6e57e0]">.</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                className={`relative px-4 py-2 text-sm lg:text-base font-medium rounded-full transition-all duration-300 ${
                  isActive
                    ? 'text-[#6e57e0] dark:text-[#12f7ff] font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#6e57e0] dark:hover:text-[#12f7ff]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#6e57e0] dark:bg-[#12f7ff]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href={cvDownloadUrl}
            download={cvDownloadName}
            target={cvDownloadUrl.startsWith('http') ? '_blank' : undefined}
            rel={cvDownloadUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            id="nav-download-cv-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-[#00c9ff] hover:text-white dark:hover:bg-[#00c9ff] dark:hover:text-slate-900 shadow-sm hover:shadow-[0_0_15px_rgba(0,201,255,0.4)]"
          >
            <span>Download CV</span>
            <FileText className="w-4 h-4" />
          </a>
          <ThemeToggle />
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 right-0 bottom-0 bg-white/95 dark:bg-[#0a0e17]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/80 p-6 flex flex-col justify-between z-40 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-lg font-medium transition ${
                  activeSection === link.id
                    ? 'bg-[#6e57e0]/10 text-[#6e57e0] dark:text-[#12f7ff] font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <a
              href={cvDownloadUrl}
              download={cvDownloadName}
              target={cvDownloadUrl.startsWith('http') ? '_blank' : undefined}
              rel={cvDownloadUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-medium text-base bg-[#6e57e0] text-white hover:bg-[#285bd4] transition shadow-lg shadow-indigo-500/25"
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
