'use client';

import React, { useState } from 'react';
import { Mail, Sparkles, Send, CheckCircle2, ShieldCheck, Bell, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from './Toast';

export default function ProjectSubscription({ compact = false }) {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          source: compact ? 'footer-widget' : 'project-section',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubscribed(true);
        addToast(data.message || 'Subscribed successfully! Thank you.', 'success');
        setEmail('');
        setName('');
      } else {
        addToast(data.error || 'Failed to subscribe. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      addToast('Network error while subscribing. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Compact layout (used inside Footer or sidebar)
  if (compact) {
    return (
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for project alerts..."
              required
              disabled={loading || subscribed}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6e57e0] dark:focus:border-[#12f7ff] transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || subscribed}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6e57e0] to-[#12f7ff] text-white text-xs sm:text-sm font-semibold hover:opacity-95 transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : subscribed ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Subscribed
              </>
            ) : (
              <>
                Subscribe <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Full High-Impact Showcase Section
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-white/90 via-slate-50/90 to-white/90 dark:from-slate-900/90 dark:via-[#0c1322]/90 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden group">
          
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-indigo-500/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition duration-700" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-cyan-500/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition duration-700" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            
            {/* Left Content Column */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-cyan-500/10 border border-indigo-500/20 dark:border-cyan-500/20 text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                <span>Instant Project Updates</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Want to know when I launch a{' '}
                <span className="bg-gradient-to-r from-[#6e57e0] to-[#12f7ff] bg-clip-text text-transparent">
                  New Project?
                </span>
              </h3>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Subscribe to get notified right in your inbox whenever I publish a new web application, mobile tool, or research publication. No spam, ever.
              </p>

              {/* Guarantees Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>No Spam Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Early Access &amp; Demos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span>1-Click Unsubscribe</span>
                </div>
              </div>
            </div>

            {/* Right Form Card Column */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-slate-100/70 dark:bg-slate-800/60 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-lg">
                {subscribed ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      You are all set!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      You will receive an email update whenever a new project is published.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubscribed(false)}
                      className="text-xs font-semibold text-indigo-500 dark:text-cyan-400 hover:underline pt-2 inline-block"
                    >
                      Subscribe another email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        First Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        disabled={loading}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6e57e0] dark:focus:border-[#12f7ff] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@domain.com"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6e57e0] dark:focus:border-[#12f7ff] transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6e57e0] to-[#12f7ff] text-white font-bold text-xs sm:text-sm hover:opacity-95 active:scale-[0.98] transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Subscribing...</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe to Project Updates</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
                      Strict privacy. Unsubscribe anytime with 1 click.
                    </p>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
