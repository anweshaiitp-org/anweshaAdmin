'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventTag } from '@/types/events';
import type { Event } from '@/types/events';
import { createEvent, updateEvent } from '@/lib/eventService';
import PosterUpload from './PosterUpload';
import toast from 'react-hot-toast';
import { FiLoader } from 'react-icons/fi';

interface EventFormProps {
  initialData?: Partial<Event>;
}

export default function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const { isDarkMode } = useAuth();
  const isEditMode = !!initialData?.id;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    organizer: initialData?.organizer || '',
    venue: initialData?.venue || '',
    description: initialData?.description || '',
    start_time: initialData?.start_time ? initialData.start_time.slice(0, 16) : '',
    end_time: initialData?.end_time ? initialData.end_time.slice(0, 16) : '',
    prize: initialData?.prize || '',
    registration_fee: initialData?.registration_fee ?? 0,
    registration_deadline: initialData?.registration_deadline ? initialData.registration_deadline.slice(0, 16) : '',
    video: initialData?.video || '',
    tags: initialData?.tags || [] as EventTag[],
    max_team_size: initialData?.max_team_size ?? 1,
    min_team_size: initialData?.min_team_size ?? 1,
    is_active: initialData?.is_active ?? false,
    is_online: initialData?.is_online ?? false,
    registration_link: initialData?.registration_link || '',
    order: initialData?.order ?? 0,
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---- Validation ----
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Event name is required';
    if (!formData.organizer.trim()) errs.organizer = 'Organizer is required';
    if (!formData.prize.trim()) errs.prize = 'Prize info is required';
    if (formData.max_team_size < formData.min_team_size)
      errs.max_team_size = 'Max must be ≥ min team size';
    if (formData.min_team_size < 1) errs.min_team_size = 'Min team size must be ≥ 1';
    if (formData.registration_fee < 0) errs.registration_fee = 'Fee cannot be negative';
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time)
      errs.end_time = 'End time must be after start time';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const toastId = toast.loading(isEditMode ? 'Updating event…' : 'Creating event…');

    try {
      const payload = {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : undefined,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
        registration_deadline: formData.registration_deadline
          ? new Date(formData.registration_deadline).toISOString()
          : undefined,
      };

      if (isEditMode) {
        await updateEvent(initialData!.id!, payload);
        toast.success('Event updated successfully!', { id: toastId });
        router.push(`/admin/events/${initialData!.id}`);
      } else {
        await createEvent(payload);
        toast.success('Event created successfully!', { id: toastId });
        router.push('/admin/events/list');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // ---- Helpers ----
  const update = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleTag = (tag: EventTag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // ---- Styles ----
  const inputCls = `w-full px-4 py-3 border-2 rounded-xl text-sm font-medium outline-none transition-colors ${
    isDarkMode
      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500'
      : 'border-[#EFF6FF] bg-[#EFF6FF]/30 text-gray-900 placeholder-gray-400 focus:border-[#2563EB] focus:bg-[#EFF6FF]/50'
  }`;

  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-2 ${
    isDarkMode ? 'text-gray-400' : 'text-[#2563EB]/70'
  }`;

  const errorCls = 'text-red-500 text-xs font-semibold mt-1';

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-5xl rounded-2xl border p-6 md:p-8 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      {/* ---- Basic Info ---- */}
      <h2 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Basic Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <label className={labelCls}>Event Name *</label>
          <input className={inputCls} value={formData.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Robo Wars" />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelCls}>Organizer *</label>
          <input className={inputCls} value={formData.organizer} onChange={(e) => update('organizer', e.target.value)} placeholder="Name:Role, Name2:Role2" />
          {errors.organizer && <p className={errorCls}>{errors.organizer}</p>}
          <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Format: &quot;Name:Role, Name2:Role2&quot;</p>
        </div>
        <div>
          <label className={labelCls}>Venue</label>
          <input className={inputCls} value={formData.venue} onChange={(e) => update('venue', e.target.value)} placeholder="e.g. Main Stage" />
        </div>
        <div>
          <label className={labelCls}>Display Order</label>
          <input type="number" className={inputCls} value={formData.order} onChange={(e) => update('order', parseInt(e.target.value) || 0)} />
        </div>
      </div>

      {/* ---- Description ---- */}
      <div className="mb-8">
        <label className={labelCls}>Description</label>
        <textarea
          rows={4}
          className={`${inputCls} resize-y`}
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Event description (supports HTML or Markdown)"
        />
      </div>

      {/* ---- Date & Time ---- */}
      <h2 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Schedule
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div>
          <label className={labelCls}>Start Time</label>
          <input type="datetime-local" className={inputCls} value={formData.start_time} onChange={(e) => update('start_time', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>End Time</label>
          <input type="datetime-local" className={inputCls} value={formData.end_time} onChange={(e) => update('end_time', e.target.value)} />
          {errors.end_time && <p className={errorCls}>{errors.end_time}</p>}
        </div>
        <div>
          <label className={labelCls}>Registration Deadline</label>
          <input type="datetime-local" className={inputCls} value={formData.registration_deadline} onChange={(e) => update('registration_deadline', e.target.value)} />
        </div>
      </div>

      {/* ---- Registration & Prizes ---- */}
      <h2 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Registration & Prizes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div>
          <label className={labelCls}>Prize *</label>
          <input className={inputCls} value={formData.prize} onChange={(e) => update('prize', e.target.value)} placeholder="e.g. 25000 or Goodies" />
          {errors.prize && <p className={errorCls}>{errors.prize}</p>}
        </div>
        <div>
          <label className={labelCls}>Registration Fee (₹)</label>
          <input type="number" min={0} className={inputCls} value={formData.registration_fee} onChange={(e) => update('registration_fee', parseInt(e.target.value) || 0)} />
          {errors.registration_fee && <p className={errorCls}>{errors.registration_fee}</p>}
        </div>
        <div>
          <label className={labelCls}>Min Team Size</label>
          <input type="number" min={1} className={inputCls} value={formData.min_team_size} onChange={(e) => update('min_team_size', parseInt(e.target.value) || 1)} />
          {errors.min_team_size && <p className={errorCls}>{errors.min_team_size}</p>}
        </div>
        <div>
          <label className={labelCls}>Max Team Size</label>
          <input type="number" min={1} className={inputCls} value={formData.max_team_size} onChange={(e) => update('max_team_size', parseInt(e.target.value) || 1)} />
          {errors.max_team_size && <p className={errorCls}>{errors.max_team_size}</p>}
        </div>
      </div>

      {/* ---- Tags ---- */}
      <div className="mb-8">
        <label className={labelCls}>Tags / Categories</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(EventTag).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wide transition-all border ${
                formData.tags.includes(tag)
                  ? isDarkMode
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#2563EB] text-white border-[#2563EB]'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400 border-gray-600 hover:border-gray-500'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tag.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Toggles ---- */}
      <div className="flex flex-wrap gap-8 mb-8">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => update('is_active', e.target.checked)}
            className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Active (visible to users)
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_online}
            onChange={(e) => update('is_online', e.target.checked)}
            className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Online Event
          </span>
        </label>
      </div>

      {/* ---- Links ---- */}
      <h2 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Links & Media
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <label className={labelCls}>YouTube Video</label>
          <input className={inputCls} value={formData.video} onChange={(e) => update('video', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
        <div>
          <label className={labelCls}>External Registration Link</label>
          <input className={inputCls} value={formData.registration_link} onChange={(e) => update('registration_link', e.target.value)} placeholder="https://forms.google.com/..." />
        </div>
      </div>

      {/* ---- Poster Upload ---- */}
      <div className="mb-10">
        <label className={labelCls}>Event Poster</label>
        <PosterUpload
          currentPosterUrl={initialData?.poster ? undefined : undefined}
          onFileSelect={setPosterFile}
        />
        <p className={`text-[10px] mt-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          Poster will be uploaded via the S3 presigned URL flow after saving the event.
        </p>
      </div>

      {/* ---- Actions ---- */}
      <div className={`flex justify-end gap-4 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <button
          type="button"
          onClick={() => router.back()}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 min-w-[140px] justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]'
          }`}
        >
          {saving ? (
            <>
              <FiLoader className="animate-spin" size={16} />
              Saving…
            </>
          ) : isEditMode ? (
            'Update Event'
          ) : (
            'Create Event'
          )}
        </button>
      </div>
    </form>
  );
}
