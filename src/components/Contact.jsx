'use client';

import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Phone, Send, Loader2, ArrowDownRight, MessageSquare } from 'lucide-react';
import { useToast } from './Toast';
import { subscribeToProfile, getCachedProfile, INITIAL_PROFILE } from '../lib/firestore';

export default function Contact({ initialProfile = null }) {
  const { addToast } = useToast();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(() => initialProfile || getCachedProfile());
  const unsubRef = useRef(null);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  useEffect(() => {
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

  const contactEmail = profile?.contactEmail || INITIAL_PROFILE.contactEmail || 'jahanrazh@gmail.com';
  const contactPhone = profile?.contactPhone || INITIAL_PROFILE.contactPhone || '+94 76-722 14 36';
  const contactWhatsapp = profile?.contactWhatsapp || INITIAL_PROFILE.contactWhatsapp || '+94 76 722 1436';
  const cleanPhone = contactPhone.replace(/[^0-9+]/g, '') || contactPhone;
  const cleanWhatsapp = contactWhatsapp.replace(/[^0-9]/g, '') || contactWhatsapp;
  const findMeTitle = profile?.findMeTitle || INITIAL_PROFILE.findMeTitle || "Let's start a project together";
  const findMeText = profile?.findMeText || INITIAL_PROFILE.findMeText || "I am always open to discussing new projects, creative ideas, or opportunities to be part of your vision. Feel free to reach out anytime!";

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

    if (!publicKey || !serviceId || !templateId) {
      addToast('EmailJS configuration missing in .env', 'error');
      setLoading(false);
      return;
    }

    try {
      if (formRef.current) {
        // Sends form fields directly matching the name attributes (name, email, subject, message)
        await emailjs.sendForm(serviceId, templateId, formRef.current, publicKey);
      } else {
        const templateParams = {
          name: formData.name,
          from_name: formData.name,
          email: formData.email,
          from_email: formData.email,
          reply_to: formData.email,
          subject: formData.subject,
          message: formData.message,
        };
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
      }

      addToast('Message sent successfully!', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('EmailJS send error:', error);
      addToast(
        error.text || error.message || 'Message failed to send. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 relative overflow-hidden bg-slate-50/50 dark:bg-[#0c121e]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Get In <span className="text-[#6e57e0] dark:text-[#12f7ff]">Touch</span>
          </h2>
          <p className="mt-2 text-xs sm:text-base text-slate-500 dark:text-slate-400">
            Do you have a project in mind? Contact me here
          </p>
          <div className="w-16 h-1 bg-[#6e57e0] dark:bg-[#12f7ff] rounded-full mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-stretch">
          {/* Left Column: Contact Info Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#00c9ff] to-[#6e57e0] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 text-white flex flex-col justify-between shadow-xl shadow-cyan-500/10">
            <div>
              <div className="inline-flex items-center gap-2 text-white/90 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-2">
                <span>Find Me</span>
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6" suppressHydrationWarning>
                {findMeTitle}
              </h3>
              <p className="text-white/85 text-xs sm:text-base leading-relaxed mb-6 sm:mb-8" suppressHydrationWarning>
                {findMeText}
              </p>
            </div>

            <div className="space-y-3.5 pt-6 border-t border-white/20">
              {/* Phone Number */}
              {contactPhone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur-sm group"
                  title="Click to call directly"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs text-white/70 block">Phone Number</span>
                    <span className="text-sm font-semibold text-white tracking-wide" suppressHydrationWarning>
                      {contactPhone}
                    </span>
                  </div>
                </a>
              )}

              {/* Email Address */}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur-sm group"
                  title="Click to send email"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs text-white/70 block">Email Address</span>
                    <span className="text-sm font-semibold text-white break-all" suppressHydrationWarning>
                      {contactEmail}
                    </span>
                  </div>
                </a>
              )}

              {/* WhatsApp Direct Chat */}
              {contactWhatsapp && (
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur-sm group"
                  title="Click to open WhatsApp chat directly"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <svg
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs text-white/70 block">WhatsApp</span>
                    <span className="text-sm font-semibold text-white tracking-wide" suppressHydrationWarning>
                      {contactWhatsapp}
                    </span>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#161f30] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6e57e0] dark:focus:border-[#12f7ff] text-sm transition"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6e57e0] dark:focus:border-[#12f7ff] text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Project inquiry / collaboration"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6e57e0] dark:focus:border-[#12f7ff] text-sm transition"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project, timeline, and goals..."
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#6e57e0] dark:focus:border-[#12f7ff] text-sm transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-white bg-[#00c9ff] hover:bg-[#00b5e7] dark:text-slate-950 transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
