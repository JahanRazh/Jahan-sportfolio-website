'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Reply,
  Eye,
  X,
  Loader2,
  Sparkles,
  ExternalLink,
  Calendar,
  User,
  ArrowRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  subscribeToAllMessages,
  markMessageAsRead,
  deleteMessageDoc,
} from '../../lib/firestore';
import { useToast } from '../Toast';

export default function MessagesManager() {
  const { addToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'replied'

  // Modal / Drawer state for viewing & replying
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Real-time listener for incoming messages
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAllMessages(
      (data) => {
        setMessages(data);
        setLoading(false);
      },
      (err) => {
        console.error('Messages subscription error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        (m.message && m.message.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'unread'
          ? m.status === 'unread'
          : statusFilter === 'replied'
          ? m.replied === true
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [messages, searchQuery, statusFilter]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.status === 'unread').length,
    [messages]
  );

  const repliedCount = useMemo(
    () => messages.filter((m) => m.replied === true).length,
    [messages]
  );

  // Open viewer modal
  const handleOpenMessage = async (msg) => {
    setSelectedMessage(msg);
    setReplySubject(
      msg.subject?.toLowerCase().startsWith('re:')
        ? msg.subject
        : `Re: ${msg.subject || 'Your portfolio inquiry'}`
    );
    setReplyText('');

    // If unread, mark as read
    if (msg.status === 'unread') {
      try {
        await markMessageAsRead(msg.id, true);
      } catch (err) {
        console.warn('Could not mark as read:', err);
      }
    }
  };

  // Toggle read/unread
  const handleToggleRead = async (e, msg) => {
    e.stopPropagation();
    const nextIsRead = msg.status === 'unread';
    try {
      await markMessageAsRead(msg.id, nextIsRead);
      addToast(nextIsRead ? 'Marked as read' : 'Marked as unread', 'info');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  // Delete message
  const handleDeleteMessage = async (e, id) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this visitor message?')) {
      return;
    }
    try {
      await deleteMessageDoc(id);
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      addToast('Message deleted.', 'success');
    } catch (err) {
      addToast('Failed to delete message: ' + err.message, 'error');
    }
  };

  // Send email reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedMessage) return;

    if (!replyText.trim()) {
      addToast('Please enter your reply message.', 'error');
      return;
    }

    setIsSendingReply(true);

    try {
      const res = await fetch('/api/contact/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          toEmail: selectedMessage.email,
          recipientName: selectedMessage.name,
          subject: replySubject,
          replyText: replyText.trim(),
          originalSubject: selectedMessage.subject,
          originalMessage: selectedMessage.message,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast(`Email reply sent to ${selectedMessage.email}!`, 'success');
        setSelectedMessage((prev) =>
          prev
            ? {
                ...prev,
                replied: true,
                status: 'replied',
                replyText: replyText.trim(),
                replySubject: replySubject,
              }
            : null
        );
        setReplyText('');
      } else if (data.reason === 'smtp_not_configured') {
        addToast(
          'Please configure SMTP_USER & SMTP_PASS in .env to send real email replies.',
          'warning'
        );
      } else {
        addToast(data.error || 'Failed to send reply email', 'error');
      }
    } catch (err) {
      addToast('Error sending reply: ' + err.message, 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Quick reply templates
  const quickTemplates = [
    {
      label: 'Thank you & inquiry acknowledgement',
      text: `Thank you for reaching out! I appreciate your message regarding my work. I would be glad to discuss this further with you. When would be a convenient time for a brief conversation or call?`,
    },
    {
      label: 'Schedule a call / Meeting',
      text: `Thank you for contacting me! I would love to connect and learn more about your project requirements. Feel free to let me know your preferred availability, and I can set up a Google Meet call.`,
    },
    {
      label: 'Freelance / Collaboration inquiry',
      text: `Thank you for reaching out with this opportunity! I am currently open to new collaborations and projects. I have reviewed your inquiry and would be excited to contribute.`,
    },
  ];

  function formatDate(ts) {
    if (!ts) return 'Recent';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ───────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Visitor Inquiries &amp; Inbox
              </span>
              {unreadCount > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Contact Messages
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Messages submitted through your portfolio&apos;s &quot;Get In Touch&quot; form are stored here. You can reply directly to visitors via email with 1 click.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Received</p>
              <p className="text-2xl font-bold text-white">{messages.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Unread Inquiries</p>
              <p className="text-2xl font-bold text-rose-400">{unreadCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Replied Via Email</p>
              <p className="text-2xl font-bold text-emerald-400">{repliedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sender, email, subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 w-full sm:w-auto justify-center">
          {['all', 'unread', 'replied'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
              {st === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages List / Table ────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm">Loading contact inquiries from Firestore...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No messages found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'No messages matching your search query.'
                : 'When visitors send messages through your Contact section, they will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredMessages.map((msg) => {
              const isUnread = msg.status === 'unread';
              const isReplied = msg.replied === true;

              return (
                <div
                  key={msg.id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`p-4 sm:p-5 hover:bg-slate-800/40 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                    isUnread ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Left: Sender & Snippet */}
                  <div className="flex items-start gap-3.5 min-w-0 w-full sm:w-auto flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {msg.name ? msg.name.slice(0, 2) : (msg.email ? msg.email.slice(0, 2) : 'VS')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {msg.name || 'Anonymous Visitor'}
                        </span>
                        <span className="text-xs text-slate-400">&lt;{msg.email}&gt;</span>

                        {isUnread && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Unread
                          </span>
                        )}
                        {isReplied && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Replied
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-1 truncate">
                        {msg.subject || 'Portfolio Inquiry'}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {msg.message}
                      </p>
                    </div>
                  </div>

                  {/* Right: Date & Quick Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(msg.createdAt)}
                    </span>

                    <button
                      onClick={(e) => handleToggleRead(e, msg)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs"
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteMessage(e, msg.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── VIEW MESSAGE & DIRECT EMAIL REPLY MODAL ───────────────────────── */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {selectedMessage.subject || 'Portfolio Inquiry'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    From: <strong className="text-white">{selectedMessage.name || 'Visitor'}</strong> ({selectedMessage.email})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Details Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Received: {formatDate(selectedMessage.createdAt)}</span>
                {selectedMessage.replied && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Already Replied
                  </span>
                )}
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Previous Reply History (if already sent) */}
            {selectedMessage.replied && selectedMessage.replyText && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" /> Sent Email Reply:
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.replyText}
                </p>
              </div>
            )}

            {/* Direct Email Reply Composer Form */}
            <form onSubmit={handleSendReply} className="pt-2 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">
                    Send Email Reply to {selectedMessage.email}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">Delivered directly to visitor inbox</span>
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(t.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 border border-slate-700 transition"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  required
                  placeholder="Re: Your inquiry"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Response Message
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                  placeholder={`Hi ${selectedMessage.name || 'there'},\n\nThank you for reaching out...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(null, selectedMessage.id)}
                  className="px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Message
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReply}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Reply...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Reply Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}
