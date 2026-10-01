'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailCheck, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialStatus = searchParams.get('status') || '';

  const [email, setEmail] = useState(initialEmail);
  const [unsubscribed, setUnsubscribed] = useState(initialStatus === 'success');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    initialStatus === 'success' ? 'You have been unsubscribed from new project notifications.' : ''
  );
  const [resubscribing, setResubscribing] = useState(false);

  useEffect(() => {
    if (initialEmail && !initialStatus && !unsubscribed) {
      handleUnsubscribe();
    }
  }, [initialEmail]);

  const handleUnsubscribe = async (e) => {
    if (e) e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUnsubscribed(true);
        setMessage(data.message || 'You have been unsubscribed successfully.');
      } else {
        setMessage(data.error || 'Failed to unsubscribe.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!email) return;
    setResubscribing(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'resubscribe-page' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUnsubscribed(false);
        setMessage('Great to have you back! Your subscription has been reactivated.');
      } else {
        setMessage(data.error || 'Failed to resubscribe.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setResubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl text-center">
        {/* Top Icon */}
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center mb-6 text-cyan-400">
          {unsubscribed ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <MailCheck className="w-8 h-8 text-indigo-400" />
          )}
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          {unsubscribed ? 'Unsubscribed' : 'Project Notifications'}
        </h1>

        <p className="text-sm text-slate-400 mb-6">
          {message ||
            (unsubscribed
              ? 'You will no longer receive emails when new projects are launched.'
              : 'Manage your portfolio project update preferences.')}
        </p>

        {unsubscribed ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 text-xs text-slate-400">
              Unsubscribed email: <span className="text-slate-200 font-semibold">{email}</span>
            </div>

            <button
              onClick={handleResubscribe}
              disabled={resubscribing}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition flex items-center justify-center gap-2"
            >
              {resubscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Changed your mind? Resubscribe
            </button>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to unsubscribe"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Unsubscribe
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
