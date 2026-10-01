'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Users,
  Send,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Download,
  Eye,
  X,
  Loader2,
  Check,
  Info,
  Radio,
  FolderGit2,
} from 'lucide-react';
import {
  subscribeToAllSubscribers,
  deleteSubscriberDoc,
  updateSubscriberStatus,
  subscribeToAllProjects,
} from '../../lib/firestore';
import { useToast } from '../Toast';

export default function SubscribersManager() {
  const { addToast } = useToast();

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'unsubscribed'

  // Service configuration status
  const [serviceStatus, setServiceStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Setup Guide Modal State
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Real-time subscribers listener
  useEffect(() => {
    setLoading(true);
    const unsubSubs = subscribeToAllSubscribers(
      (data) => {
        setSubscribers(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    const unsubProjects = subscribeToAllProjects((data) => {
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    });

    fetchServiceStatus();

    return () => {
      unsubSubs();
      unsubProjects();
    };
  }, []);

  const fetchServiceStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/newsletter/status');
      const data = await res.json();
      if (res.ok && data.success) {
        setServiceStatus(data.emailStatus);
      }
    } catch (e) {
      console.warn('Could not fetch email status:', e);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesSearch =
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ? true : s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchQuery, statusFilter]);

  const activeSubscribersCount = useMemo(
    () => subscribers.filter((s) => s.status === 'active').length,
    [subscribers]
  );

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Handle subscriber delete
  const handleDeleteSubscriber = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from subscribers?`)) {
      return;
    }
    try {
      await deleteSubscriberDoc(id);
      addToast(`Subscriber ${email} removed.`, 'success');
    } catch (error) {
      addToast('Failed to delete subscriber: ' + error.message, 'error');
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (subscriber) => {
    const nextStatus = subscriber.status === 'active' ? 'unsubscribed' : 'active';
    try {
      await updateSubscriberStatus(subscriber.id, nextStatus);
      addToast(`Status updated to ${nextStatus}`, 'success');
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

  // Copy all active emails
  const handleCopyEmails = () => {
    const emails = subscribers
      .filter((s) => s.status === 'active')
      .map((s) => s.email)
      .join(', ');

    if (!emails) {
      addToast('No active subscriber emails to copy.', 'warning');
      return;
    }

    navigator.clipboard.writeText(emails);
    addToast(`Copied ${activeSubscribersCount} active emails to clipboard!`, 'success');
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (subscribers.length === 0) {
      addToast('No subscriber data to export.', 'warning');
      return;
    }

    const headers = ['Email', 'Name', 'Status', 'Source', 'Subscribed At'];
    const rows = subscribers.map((s) => [
      `"${s.email || ''}"`,
      `"${s.name || ''}"`,
      `"${s.status || 'active'}"`,
      `"${s.source || 'portfolio'}"`,
      `"${formatDate(s.createdAt || s.subscribedAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Subscriber list exported as CSV!', 'success');
  };

  // Send single test email
  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      addToast('Please enter a valid test email address.', 'error');
      return;
    }
    if (!selectedProject) {
      addToast('Please select a project to include in the notification.', 'error');
      return;
    }

    setIsSendingTest(true);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/newsletter/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          targetEmail: testEmail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`Test email sent successfully to ${testEmail}!`, 'success');
        setBroadcastResult({ type: 'success', text: `Test email sent to ${testEmail}` });
      } else {
        addToast(data.error || 'Failed to send test email', 'error');
        setBroadcastResult({ type: 'error', text: data.error || 'Failed to send' });
      }
    } catch (err) {
      addToast('Network error while sending test email: ' + err.message, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Broadcast to all active subscribers
  const handleBroadcastAll = async () => {
    if (!selectedProject) {
      addToast('Please select a project to broadcast.', 'error');
      return;
    }
    if (activeSubscribersCount === 0) {
      addToast('You have 0 active subscribers to notify.', 'warning');
      return;
    }

    const confirmMsg = `Are you sure you want to send a New Project Launch announcement for "${selectedProject.name}" to ALL ${activeSubscribersCount} active subscribers?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/newsletter/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProject,
          sendToAll: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`Broadcast complete! Sent to ${data.sentCount} subscribers.`, 'success');
        setBroadcastResult({
          type: 'success',
          text: `Delivered to ${data.sentCount} out of ${data.totalSubscribers} subscribers.`,
        });
      } else {
        addToast(data.error || 'Broadcast failed', 'error');
        setBroadcastResult({ type: 'error', text: data.error || 'Failed to broadcast' });
      }
    } catch (err) {
      addToast('Error during broadcast: ' + err.message, 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  function formatDate(ts) {
    if (!ts) return 'Recent';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  }

  const isSmtpReady = serviceStatus?.smtp?.configured;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Overview ────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Project Notification Hub
              </span>
              {isSmtpReady ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> SMTP Ready
                </span>
              ) : (
                <button
                  onClick={() => setShowConfigGuide(true)}
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center gap-1"
                >
                  <Info className="w-3 h-3" /> Setup SMTP
                </button>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Newsletter &amp; Project Subscribers
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Visitors who subscribe on your portfolio receive automated, professional email notifications whenever you publish a new project.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setIsBroadcastModalOpen(true);
                setBroadcastResult(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Project Launch</span>
            </button>

            <button
              onClick={() => setShowConfigGuide(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition flex items-center gap-2"
              title="Email Delivery Settings Guide"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Email Settings</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Registered</p>
              <p className="text-2xl font-bold text-white">{subscribers.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Subscribers</p>
              <p className="text-2xl font-bold text-emerald-400">{activeSubscribersCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Published Projects</p>
              <p className="text-2xl font-bold text-indigo-400">{projects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Controls Bar ───────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriber email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            {['all', 'active', 'unsubscribed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyEmails}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Copy Active Emails"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Subscribers Table ────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm">Loading subscribers from Firestore...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-16 text-center">
            <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No subscribers found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'No subscribers matching your search term.'
                : 'Visitors will appear here automatically when they subscribe to project updates on your portfolio.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Mobile Cards View (< sm) */}
            <div className="block sm:hidden divide-y divide-slate-800/80">
              {filteredSubscribers.map((sub) => {
                const isActive = sub.status === 'active';
                return (
                  <div key={sub.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {sub.email ? sub.email.slice(0, 2) : 'EM'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-xs sm:text-sm truncate">
                            {sub.email}
                          </p>
                          {sub.name && (
                            <p className="text-[11px] text-slate-400 truncate">{sub.name}</p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {isActive ? 'Active' : 'Unsubscribed'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Source: <strong className="text-slate-300 capitalize">{sub.source || 'portfolio'}</strong></span>
                      <span>{formatDate(sub.createdAt || sub.subscribedAt)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/50">
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                      >
                        {isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                        title="Delete Subscriber"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 min-w-[640px]">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Subscriber</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Subscribed</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSubscribers.map((sub) => {
                    const isActive = sub.status === 'active';
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-800/30 transition group"
                      >
                        {/* Email & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-bold text-xs uppercase">
                              {sub.email ? sub.email.slice(0, 2) : 'EM'}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                {sub.email}
                              </div>
                              {sub.name && (
                                <div className="text-xs text-slate-400">{sub.name}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 capitalize">
                            {sub.source || 'portfolio'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                            {isActive ? 'Active' : 'Unsubscribed'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {formatDate(sub.createdAt || sub.subscribedAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(sub)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs"
                              title={isActive ? 'Mark Unsubscribed' : 'Reactivate'}
                            >
                              {isActive ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                              title="Delete Subscriber"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── BROADCAST PROJECT MODAL ───────────────────────────────────────── */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Broadcast Project Launch</h3>
                  <p className="text-xs text-slate-400">
                    Notify {activeSubscribersCount} active subscribers about a project
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Project to broadcast */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Project to Announce
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.category || 'Project'})
                  </option>
                ))}
              </select>
            </div>

            {/* Project Preview Card */}
            {selectedProject && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                    {selectedProject.category || 'Web Application'}
                  </span>
                  <span className="text-slate-500">Live Preview</span>
                </div>
                <h4 className="text-base font-bold text-white">{selectedProject.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {selectedProject.shortDescription || selectedProject.description || 'No description provided.'}
                </p>
                {Array.isArray(selectedProject.technologies) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedProject.technologies.slice(0, 5).map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Delivery Status / Feedback */}
            {broadcastResult && (
              <div
                className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                  broadcastResult.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-300 border border-red-500/30'
                }`}
              >
                {broadcastResult.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{broadcastResult.text}</span>
              </div>
            )}

            {/* 2. Test Email Delivery Section */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Test Email Delivery (Recommended First)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter your email to receive a test preview..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>Send Test</span>
                </button>
              </div>
            </div>

            {/* 3. Broadcast to All Active Subscribers */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleBroadcastAll}
                disabled={isBroadcasting || activeSubscribersCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast to All {activeSubscribersCount} Subscribers</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── EMAIL SETUP GUIDE MODAL ───────────────────────────────────────── */}
      {showConfigGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Email Notification Setup</h3>
                  <p className="text-xs text-slate-400">
                    How automated emails are delivered to subscribers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigGuide(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                To automatically send rich HTML emails when you add projects or when visitors subscribe, you can use your Gmail address or any standard SMTP service.
              </p>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="font-semibold text-cyan-400 text-sm">
                  Quick 1-Minute Setup in your <code className="text-indigo-400">.env</code> file:
                </p>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto select-all">
{`# SMTP Email Credentials (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME="Ramesh Jahan Jayalath"`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">How to get a free Gmail App Password:</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  <li>Go to your Google Account (<a href="https://myaccount.google.com/security" target="_blank" className="text-cyan-400 underline">myaccount.google.com/security</a>).</li>
                  <li>Enable <strong>2-Step Verification</strong> if not already active.</li>
                  <li>Search for <strong>"App passwords"</strong> in the top search bar.</li>
                  <li>Enter app name (e.g. <code>Portfolio Newsletter</code>) and click Create.</li>
                  <li>Copy the 16-character password into <code className="text-indigo-400">SMTP_PASS</code> in <code className="text-indigo-400">.env</code>.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <span>
                  All subscriptions are recorded in Firestore immediately even before configuring SMTP.
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowConfigGuide(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
