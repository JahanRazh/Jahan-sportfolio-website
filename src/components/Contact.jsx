'use client';

import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Phone, Send, Loader2, ArrowDownRight } from 'lucide-react';
import { useToast } from './Toast';

export default function Contact() {
  const { addToast } = useToast();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
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
    <section id="contact" className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-[#0c121e]/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Get In <span className="text-[#6e57e0] dark:text-[#12f7ff]">Touch</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Do you have a project in mind? Contact me here
          </p>
          <div className="w-16 h-1 bg-[#6e57e0] dark:bg-[#12f7ff] rounded-full mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Contact Info Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#00c9ff] to-[#6e57e0] rounded-3xl p-8 sm:p-10 text-white flex flex-col justify-between shadow-xl shadow-cyan-500/10">
            <div>
              <div className="inline-flex items-center gap-2 text-white/90 text-sm font-semibold tracking-wider uppercase mb-2">
                <span>Find Me</span>
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-6">
                Let&apos;s start a project together
              </h3>
              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-8">
                I am always open to discussing new projects, creative ideas, or
                opportunities to be part of your vision. Feel free to reach out anytime!
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/20">
              <a
                href="mailto:jahanrazh@gmail.com"
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-white/70 block">Email Address</span>
                  <span className="text-sm font-semibold text-white">jahanrazh@gmail.com</span>
                </div>
              </a>

              <a
                href="tel:+94767221436"
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-white/70 block">Phone Number</span>
                  <span className="text-sm font-semibold text-white">+94 76-722 14 36</span>
                </div>
              </a>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#161f30] rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
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
