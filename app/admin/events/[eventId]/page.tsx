'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchEvent, parseOrganizers } from '@/lib/eventService';
import type { Event } from '@/types/events';
import { DetailSkeleton } from '@/components/events/EventLoadingSkeleton';
import ErrorState from '@/components/events/ErrorState';
import { FiEdit2, FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiDollarSign, FiGlobe, FiExternalLink, FiVideo, FiClock } from 'react-icons/fi';

export default function ViewEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { isDarkMode } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const decodedId = decodeURIComponent(eventId);
      const res = await fetchEvent(decodedId);
      if (res.success) {
        setEvent(res.event);
        if (res.event.poster) {
          try {
            const pRes = await fetch(`/api/admin/events/${encodeURIComponent(decodedId)}/poster`);
            const pData = await pRes.json();
            if (pData.success && pData.url) setPosterUrl(pData.url);
          } catch (e) {
            console.error("Failed to fetch poster URL", e);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!event) return <ErrorState message="Event not found" />;

  const organizers = parseOrganizers(event.organizer);

  const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
    <div className="flex flex-col">
      <span className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>
        <Icon size={12} /> {label}
      </span>
      <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</span>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/events/list"
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-blue-50 text-gray-500'}`}
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
              {event.name}
            </h1>
            <p className={`text-xs font-mono mt-0.5 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>{event.id}</p>
          </div>
        </div>
      </div>

      {/* Status + Tags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
          event.is_active
            ? isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : isDarkMode ? 'bg-gray-700 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-500 border border-gray-200'
        }`}>
          {event.is_active ? 'Active' : 'Inactive'}
        </span>
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
          isDarkMode ? 'bg-purple-900/40 text-purple-400 border border-purple-800/50' : 'bg-purple-50 text-purple-600 border border-purple-100'
        }`}>
          {event.is_online ? 'Online' : 'Offline'}
        </span>
        {event.tags?.map((tag) => (
          <span key={tag} className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
            isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50' : 'bg-blue-50 text-[#2563EB] border border-blue-100'
          }`}>
            {tag.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Poster Display */}
      {posterUrl && (
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} flex justify-center`}>
          <img src={posterUrl} alt={`${event.name} Poster`} className="max-h-96 object-contain rounded-lg" />
        </div>
      )}

      {/* Details Card */}
      <div className={`p-6 md:p-8 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <InfoItem icon={FiCalendar} label="Start" value={formatDate(event.start_time)} />
          <InfoItem icon={FiClock} label="End" value={formatDate(event.end_time)} />
          <InfoItem icon={FiMapPin} label="Venue" value={event.venue || 'TBA'} />
          <InfoItem icon={FiCalendar} label="Reg. Deadline" value={formatDate(event.registration_deadline)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <InfoItem icon={FiDollarSign} label="Prize" value={event.prize || '—'} />
          <InfoItem icon={FiDollarSign} label="Registration Fee" value={event.registration_fee === 0 ? 'Free' : `₹${event.registration_fee}`} />
          <InfoItem icon={FiUsers} label="Team Size" value={`${event.min_team_size} – ${event.max_team_size}`} />
          <InfoItem icon={FiGlobe} label="Order" value={event.order} />
        </div>

        {/* Organizers */}
        {organizers.length > 0 && (
          <div className={`mb-8 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>Organizers</h3>
            <div className="flex flex-wrap gap-3">
              {organizers.map(([name, role], i) => (
                <div key={i} className={`px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{name}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className={`mb-8 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>Description</h3>
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {event.description}
            </div>
          </div>
        )}

        {/* Links */}
        {(event.video || event.registration_link) && (
          <div className={`pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>Links</h3>
            <div className="flex flex-wrap gap-3">
              {event.video && (
                <a href={event.video} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}>
                  <FiVideo size={14} /> YouTube Video <FiExternalLink size={12} />
                </a>
              )}
              {event.registration_link && (
                <a href={event.registration_link} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}>
                  <FiExternalLink size={14} /> Registration Link
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className={`text-xs font-mono ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
        Created: {new Date(event.created_at).toLocaleString()} · Updated: {new Date(event.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
