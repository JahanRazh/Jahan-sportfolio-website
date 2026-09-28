'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Users, Eye } from 'lucide-react';
import { subscribeToVisitorStats, subscribeToSocialLinks, INITIAL_SOCIAL_LINKS } from '../lib/firestore';

export default function Footer() {
  const [visitorStats, setVisitorStats] = useState({ totalViews: 0, uniqueVisitors: 0 });
  const [socialLinks, setSocialLinks] = useState(INITIAL_SOCIAL_LINKS.filter((l) => l.showInFooter && l.published));
  const unsubSocialRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToVisitorStats((data) => {
      if (data) {
        setVisitorStats(data);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (unsubSocialRef.current) { unsubSocialRef.current(); unsubSocialRef.current = null; }
    const unsub = subscribeToSocialLinks((data) => {
      setSocialLinks(data.filter((l) => l.showInFooter && l.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    unsubSocialRef.current = unsub;
    return () => { if (unsubSocialRef.current) { unsubSocialRef.current(); unsubSocialRef.current = null; } };
  }, []);

  const footerLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <footer className="py-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0e17] transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center justify-center text-center">
        {/* Brand Name */}
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
          Ramesh Jahan Jayalath
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          IT Professional &amp; Software Developer · Jahan Jayalath (Jahan Razh)
        </p>

        {/* Menu */}
        <ul className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 mb-8">
          {footerLinks.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#6e57e0] dark:hover:text-[#12f7ff] transition"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Social Icons */}
        <div className="flex items-center gap-4 mb-8">
          {socialLinks.map((social) => (
            <a
              key={social.id || social.name}
              href={social.url || social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#12f7ff] hover:scale-110 transition duration-200"
            >
              <img
                src={social.icon}
                alt={social.name}
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
              />
            </a>
          ))}
        </div>
 
        {/* Live Visitor Counter Pill */}
        {visitorStats.totalViews > 0 && (
          <div className="mb-6 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur-sm transition-all hover:scale-105">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
              <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
              <span>{visitorStats.uniqueVisitors.toLocaleString()}</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Visitors</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
              <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
              <span>{visitorStats.totalViews.toLocaleString()}</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Views</span>
          </div>
        )}

        {/* Copyright */}
        <p suppressHydrationWarning className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
          Copyright &copy; {new Date().getFullYear()}{' '}
          <a href="#home" className="text-slate-700 dark:text-slate-300 font-semibold hover:underline">
            Ramesh Jahan Jayalath
          </a>{' '}
          - All rights reserved.
        </p>
      </div>
    </footer>
  );
}
