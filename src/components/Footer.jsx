'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const footerLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ];

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/_jahan_razh_',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg',
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/in/jahanrazh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg',
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/channel/UC_4OKBZ0RYHTDxKYHwFFojw',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/youtube.svg',
    },
    {
      name: 'GitHub',
      href: 'https://github.com/JahanRazh',
      icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/github.svg',
    },
  ];

  return (
    <footer className="py-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0e17] transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center justify-center text-center">
        {/* Brand Name */}
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
          Jahan Ramesh
        </h3>

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
              key={social.name}
              href={social.href}
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

        {/* Copyright */}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
          Copyright &copy; {new Date().getFullYear()}{' '}
          <a href="#home" className="text-slate-700 dark:text-slate-300 font-semibold hover:underline">
            Jahan Ramesh
          </a>{' '}
          - All rights reserved.
        </p>
      </div>
    </footer>
  );
}
