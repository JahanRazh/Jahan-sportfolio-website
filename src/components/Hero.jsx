'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FileText, MousePointer2 } from 'lucide-react';
import { subscribeToProfile, getCachedProfile, INITIAL_PROFILE } from '../lib/firestore';
import { subscribeToSocialLinks, INITIAL_SOCIAL_LINKS } from '../lib/firestore';
import { getDirectDownloadUrl, downloadPdfDirectly } from '../lib/downloadHelper';

export default function Hero({ initialProfile = null }) {
  const [profile, setProfile] = useState(() => initialProfile || getCachedProfile());
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [socialLinks, setSocialLinks] = useState(INITIAL_SOCIAL_LINKS.filter((l) => l.showInHero && l.published));
  const unsubRef = useRef(null);
  const unsubSocialRef = useRef(null);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  useEffect(() => {
    // Tear down any previous subscription (handles React Strict Mode double-invocation)
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    const unsub = subscribeToProfile((data) => {
      if (data) setProfile(data);
    });
    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (unsubSocialRef.current) { unsubSocialRef.current(); unsubSocialRef.current = null; }
    const unsub = subscribeToSocialLinks((data) => {
      setSocialLinks(data.filter((l) => l.showInHero && l.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    unsubSocialRef.current = unsub;
    return () => { if (unsubSocialRef.current) { unsubSocialRef.current(); unsubSocialRef.current = null; } };
  }, []);

  const cvDownloadUrl = profile.cvUrl || '/assets/cv/Jahan_Jayalath-CV.pdf';
  const cvDownloadName = profile.cvFileName || 'Jahan_Jayalath_CV.pdf';
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const typedList = Array.isArray(profile.heroTitles) && profile.heroTitles.length > 0
    ? profile.heroTitles
    : INITIAL_PROFILE.heroTitles;

  useEffect(() => {
    if (!typedList || typedList.length === 0) return;
    const fullText = typedList[currentTextIndex % typedList.length] || '';
    const speed = isDeleting ? 40 : 90;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < fullText.length) {
          setCurrentText(fullText.substring(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(fullText.substring(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % typedList.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentTextIndex, typedList]);


  return (
    <section
      id="home"
      className="relative min-h-[90vh] sm:min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-16 flex items-center justify-center overflow-hidden"
    >
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#6e57e0]/15 dark:bg-[#6e57e0]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#00c9ff]/15 dark:bg-[#12f7ff]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-8">
          {/* Left Text Content */}
          <div className="w-full lg:w-7/12 flex flex-col items-start text-left z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#c0a631]/15 border border-[#c0a631]/40 text-[#c0a631] font-semibold text-xs sm:text-sm mb-3 sm:mb-4">
              <span suppressHydrationWarning>{profile.heroBadge || INITIAL_PROFILE.heroBadge}</span>
            </div>

            {/* Title with typewriter */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight min-h-[50px] sm:min-h-[80px]">
              I&apos;m{' '}
              <span className="text-[#0284c7] dark:text-[#12f7ff] border-r-2 border-[#0284c7] dark:border-[#12f7ff] pr-1 animate-pulse">
                {currentText}
              </span>
            </h1>

            {/* Description */}
            <p suppressHydrationWarning className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl whitespace-pre-line">
              {profile.heroIntro || INITIAL_PROFILE.heroIntro}
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="#contact"
                className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-base text-white bg-[#6e57e0] hover:bg-[#285bd4] transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Hire Me
              </a>
              <a
                href={getDirectDownloadUrl(cvDownloadUrl, cvDownloadName)}
                download={cvDownloadName}
                onClick={(e) => {
                  e.preventDefault();
                  downloadPdfDirectly(cvDownloadUrl, cvDownloadName);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-base whitespace-nowrap shrink-0 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-[#00c9ff] hover:text-white dark:hover:bg-[#00c9ff] dark:hover:text-slate-900 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(0,201,255,0.4)] hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Download CV</span>
                <FileText className="w-4 h-4" />
              </a>
            </div>

            {/* Social Icons Bar */}
            <div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-2.5 sm:gap-3.5">
              {socialLinks.map((social) => (
                <a
                  key={social.id || social.name}
                  href={social.url || social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-[#12f7ff] dark:hover:border-[#12f7ff] hover:scale-110 transition-all duration-200"
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    width={20}
                    height={20}
                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Right Floating Image */}
          <div className="w-full lg:w-5/12 flex justify-center items-center">
            <div className="relative group">
              {/* Outer decorative ring */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#6e57e0] via-[#00c9ff] to-[#12f7ff] rounded-[55%_45%_55%_45%] opacity-70 blur-lg group-hover:opacity-100 transition duration-700 animate-pulse" />
              
              <div className="relative w-60 h-60 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-[55%_45%_55%_45%] overflow-hidden border-4 border-white/60 dark:border-slate-700/60 shadow-2xl animate-imgFloat bg-slate-900">
                <img
                  src={profile.profileImageUrl || INITIAL_PROFILE.profileImageUrl}
                  alt="Jahan Ramesh - Software Engineer"
                  className="w-full h-full object-cover select-none"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 sm:mt-16 flex justify-center">
          <a
            href="#about"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md hover:text-[#6e57e0] dark:hover:text-[#12f7ff] transition group"
          >
            <MousePointer2 className="w-4 h-4 text-[#6e57e0] dark:text-[#12f7ff] group-hover:translate-y-0.5 transition" />
            <span>Scroll Down</span>
          </a>
        </div>
      </div>
    </section>
  );
}
