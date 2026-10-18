'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  FiX,
  FiCopy,
  FiCheck,
  FiShare2,
  FiExternalLink
} from 'react-icons/fi';
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaTwitter,
  FaEnvelope
} from 'react-icons/fa';

export function getPublicFormUrl(formId: string): string {
  if (typeof window === 'undefined') return `/forms/${formId}`;
  const origin = window.location.origin;

  if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
    return `${process.env.NEXT_PUBLIC_FRONTEND_URL.replace(/\/$/, '')}/forms/${formId}`;
  }

  // If deployed on admin domain, e.g. admin.anwesha.live -> anwesha.live
  if (origin.includes('admin.')) {
    return `${origin.replace('admin.', '')}/forms/${formId}`;
  }

  return `${origin}/forms/${formId}`;
}

interface ShareFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    form_id: string;
    title?: string;
    event_name?: string;
    target_college?: string;
  } | null;
  isDark?: boolean;
}

export default function ShareFormModal({
  isOpen,
  onClose,
  form,
  isDark = true
}: ShareFormModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !form) return null;

  const url = getPublicFormUrl(form.form_id);
  const shareTitle = form.title || form.event_name || 'Event Registration';
  const shareText = `Register for ${shareTitle} at Anwesha '27!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Form link copied to clipboard!');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url
        });
        toast.success('Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n\n👉 Register here: ${url}`
  )}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    url
  )}&text=${encodeURIComponent(shareText)}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${shareText} #Anwesha27`
  )}&url=${encodeURIComponent(url)}`;

  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `Registration Link: ${shareTitle}`
  )}&body=${encodeURIComponent(
    `Hello,\n\nYou can register for ${shareTitle} at Anwesha '27 using the link below:\n\n${url}\n\nRegards,\nAnwesha Team`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 transition-all ${
          isDark
            ? 'bg-gray-850 border-gray-700/80 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <FiShare2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Share Registration Link</h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {form.title || form.event_name} • <span className="font-mono text-amber-500">{form.form_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-750' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="mt-5">
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Public Form URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none transition-all select-all ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-gray-200 focus:border-amber-500'
                  : 'bg-gray-50 border-gray-300 text-gray-800 focus:border-amber-500'
              }`}
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              }`}
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="mt-5">
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Quick Share Platforms
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FaWhatsapp size={16} /> WhatsApp
            </a>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <FaTelegramPlane size={16} /> Telegram
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800 hover:bg-black text-white text-xs font-bold border border-gray-700 shadow-md transition-all cursor-pointer"
            >
              <FaTwitter size={16} /> Twitter / X
            </a>

            <a
              href={emailUrl}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-750 text-gray-200 border-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
            >
              <FaEnvelope size={15} /> Email
            </a>
          </div>
        </div>

        {/* QR Code and Native Share Section */}
        <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-5">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-200 shrink-0">
            <QRCode value={url} size={110} level="M" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
              QR Code Direct Access
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed mb-3`}>
              Scan with any mobile camera or QR reader to instantly open the registration page. Perfect for projecting on screens or printing posters.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                }`}
              >
                <FiShare2 size={13} /> Device Share Sheet
              </button>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                }`}
              >
                <FiExternalLink size={13} /> Open Form Page
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
