'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileText, MousePointer2 } from 'lucide-react';

const TYPED_STRINGS = ['Jahan', 'Full Stack Developer', 'Designer', 'Youtuber'];

export default function Hero() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = TYPED_STRINGS[currentTextIndex];
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
          setCurrentTextIndex((prev) => (prev + 1) % TYPED_STRINGS.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentTextIndex]);

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://fb.com/rjahan.razh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/facebook.svg',
    },
    {
      name: 'GitHub',
      href: 'https://github.com/JahanRazh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/github.svg',
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/_jahan_razh_',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg',
    },
    {
      name: 'YouTube',
      href: 'https://www.youtube.com/channel/UC_4OKBZ0RYHTDxKYHwFFojw',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/youtube.svg',
    },
    {
      name: 'Twitter/X',
      href: 'https://twitter.com/jahan3165',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/twitter.svg',
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/jahanrazh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg',
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/jahanramesh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/discord.svg',
    },
    {
      name: 'Stack Overflow',
      href: 'https://stackoverflow.com/users/jahan-ramesh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/stack-overflow.svg',
    },
    {
      name: 'HackerRank',
      href: 'https://www.hackerrank.com/jahanrazh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/hackerrank.svg',
    },
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen pt-28 pb-16 flex items-center justify-center overflow-hidden"
    >
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#6e57e0]/15 dark:bg-[#6e57e0]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00c9ff]/15 dark:bg-[#12f7ff]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8">
          {/* Left Text Content */}
          <div className="w-full lg:w-7/12 flex flex-col items-start text-left z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c0a631]/15 border border-[#c0a631]/40 text-[#c0a631] font-semibold text-xs sm:text-sm mb-4">
              <span>Software Engineer</span>
            </div>

            {/* Title with typewriter */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight min-h-[75px] sm:min-h-[90px]">
              I&apos;m{' '}
              <span className="text-[#1e9fab] dark:text-[#12f7ff] border-r-2 border-[#12f7ff] pr-1 animate-pulse">
                {currentText}
              </span>
            </h1>

            {/* Description */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              I am a Software Engineering undergraduate student at SLIIT University.
              Passionate about coding, software development, and continuously learning
              new technologies and methodologies in the field. Skilled in programming
              languages such as Java, Python, and C++. Experienced in web development,
              mobile app development, and database management.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white bg-[#6e57e0] hover:bg-[#285bd4] transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Hire Me
              </a>
              <a
                href="/assets/cv/Jahan_Jayalath-CV.pdf"
                download="Jahan_Jayalath_CV.pdf"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-[#00c9ff] hover:text-white dark:hover:bg-[#00c9ff] dark:hover:text-slate-900 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(0,201,255,0.4)] hover:-translate-y-0.5"
              >
                <span>Download CV</span>
                <FileText className="w-4 h-4" />
              </a>
            </div>

            {/* Social Icons Bar */}
            <div className="mt-12 flex flex-wrap items-center gap-3.5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-[#12f7ff] dark:hover:border-[#12f7ff] hover:scale-110 transition-all duration-200"
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    width={22}
                    height={22}
                    className="w-5 h-5 object-contain"
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
              
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-[55%_45%_55%_45%] overflow-hidden border-4 border-white/60 dark:border-slate-700/60 shadow-2xl animate-imgFloat bg-slate-900">
                <img
                  src="/assets/images/me.jpg"
                  alt="Jahan Ramesh - Software Engineer"
                  className="w-full h-full object-cover select-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 flex justify-center">
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
