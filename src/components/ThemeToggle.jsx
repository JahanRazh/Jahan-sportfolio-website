'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import {
  subscribeToPortfolioTheme,
  getCachedPortfolioTheme,
  applyThemeToDom,
  DEFAULT_PORTFOLIO_THEME,
} from '../lib/firestore';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  portfolioTheme: DEFAULT_PORTFOLIO_THEME,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [portfolioTheme, setPortfolioTheme] = useState(getCachedPortfolioTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'dark';
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }

    // Subscribe to portfolio dynamic color theme
    const unsubTheme = subscribeToPortfolioTheme((t) => {
      if (t) {
        setPortfolioTheme(t);
        applyThemeToDom(t);
      }
    });

    setMounted(true);
    return () => unsubTheme();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, portfolioTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center opacity-0 ${className}`}>
        <Sun className="w-5 h-5" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      id="theme-toggle-btn"
      aria-label="Toggle theme"
      className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]'
          : 'bg-white/90 border-slate-200 text-indigo-600 hover:bg-slate-100 hover:shadow-[0_0_15px_rgba(79,70,229,0.25)]'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
