'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchEvent, parseOrganizers, deleteEvent } from '@/lib/eventService';
import type { Event } from '@/types/events';
import { DetailSkeleton } from '@/components/events/EventLoadingSkeleton';
import ErrorState from '@/components/events/ErrorState';
import DeleteConfirmModal from '@/components/events/DeleteConfirmModal';
import toast from 'react-hot-toast';
import { 
  FiEdit2, FiArrowLeft, FiCalendar, FiMapPin, FiUsers, 
  FiDollarSign, FiGlobe, FiExternalLink, FiVideo, FiClock, FiTrash2, FiInfo ,FiImage
} from 'react-icons/fi';

export default function ViewEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { isDarkMode } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  // ---- Delete Modal State ----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---- Delete Handler ----
  const handleDeleteConfirm = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      toast.success(`"${event.name}" deleted successfully`);
      router.push('/admin/events/list');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
      setIsDeleting(false);
    }
  };

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

  // --- Reusable Sidebar Item ---
  const SidebarItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-4 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
      <div className={`p-2.5 rounded-lg shrink-0 ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {label}
        </p>
        <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* ======================= */}
      {/* HEADER SECTION          */}
      {/* ======================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/events/list"
            className={`p-2.5 rounded-full transition-colors border ${
              isDarkMode 
                ? 'border-gray-700 hover:bg-gray-800 text-gray-400' 
                : 'border-gray-200 hover:bg-gray-50 text-gray-500'
            }`}
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {event.name}
            </h1>
            <p className={`text-xs font-mono mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              ID: {event.id}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <Link
            href={`/admin/events/${event.id}/edit`}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 md:flex-none ${
              isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-[#2563EB] text-white hover:bg-blue-700'
            }`}
          >
            <FiEdit2 size={16} /> Edit Event
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 md:flex-none border ${
              isDarkMode 
                ? 'bg-gray-800 border-red-900/50 text-red-400 hover:bg-red-900/30' 
                : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <FiTrash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* ======================= */}
      {/* 2-COLUMN LAYOUT         */}
      {/* ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status & Tags Row */}
          <div className={`p-5 rounded-2xl border flex flex-wrap items-center gap-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <span className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider ${
              event.is_active
                ? isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isDarkMode ? 'bg-gray-700 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              {event.is_active ? '● Active' : '○ Inactive'}
            </span>
            <span className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider ${
              isDarkMode ? 'bg-purple-900/40 text-purple-400 border border-purple-800/50' : 'bg-purple-50 text-purple-600 border border-purple-100'
            }`}>
              {event.is_online ? '🌐 Online' : '🏛️ Offline'}
            </span>
            <div className={`w-px h-6 mx-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            {event.tags?.map((tag) => (
              <span key={tag} className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider ${
                isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50' : 'bg-blue-50 text-[#2563EB] border border-blue-100'
              }`}>
                {tag.replace('_', ' ')}
              </span>
            ))}
          </div>

          {/* Description */}
          {event.description && (
            <div className={`p-6 md:p-8 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>
                <FiInfo size={14} /> About this Event
              </h3>
              <div 
                className={`prose max-w-none ${
                  isDarkMode 
                    ? 'prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white prose-blockquote:text-gray-300 prose-blockquote:border-gray-600 prose-a:text-blue-400' 
                    : 'prose-p:text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-blockquote:text-gray-700 prose-a:text-blue-600'
                }`}
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Organizers */}
          {organizers.length > 0 && (
            <div className={`p-6 md:p-8 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>
                <FiUsers size={14} /> Organizers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {organizers.map(([name, role], i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{name}</p>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{role || 'Organizer'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(event.video || event.registration_link) && (
            <div className={`p-6 md:p-8 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-[#2563EB]/60'}`}>
                <FiGlobe size={14} /> External Links
              </h3>
              <div className="flex flex-wrap gap-4">
                {event.video && (
                  <a href={event.video} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                      isDarkMode ? 'bg-gray-900/50 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}>
                    <FiVideo size={16} className="text-red-500" /> YouTube Video <FiExternalLink size={14} className="ml-1 opacity-50" />
                  </a>
                )}
                {event.registration_link && (
                  <a href={event.registration_link} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                      isDarkMode ? 'bg-gray-900/50 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}>
                    <FiExternalLink size={16} className="text-blue-500" /> Registration Link
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar (Poster & Quick Info) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Poster */}
          {posterUrl ? (
            <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <img src={posterUrl} alt={`${event.name} Poster`} className="w-full object-cover" />
            </div>
          ) : (
            <div className={`rounded-2xl border p-8 flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-white border-gray-100 text-gray-400'}`}>
              <FiImage size={32} className="mb-3 opacity-50" />
              <p className="text-sm font-medium">No poster uploaded</p>
            </div>
          )}

          {/* Quick Info Card */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <SidebarItem icon={FiCalendar} label="Start Date" value={formatDate(event.start_time)} />
            <SidebarItem icon={FiClock} label="End Date" value={formatDate(event.end_time)} />
            <div className={`h-px w-full my-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
            <SidebarItem icon={FiMapPin} label="Venue" value={event.is_online ? 'Online Platform' : (event.venue || 'TBA')} />
            <SidebarItem icon={FiUsers} label="Team Size" value={`${event.min_team_size} – ${event.max_team_size} members`} />
            <div className={`h-px w-full my-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
            <SidebarItem icon={FiDollarSign} label="Registration Fee" value={event.registration_fee === 0 ? 'Free' : `₹${event.registration_fee}`} />
            <SidebarItem icon={FiDollarSign} label="Prize Pool" value={event.prize || '—'} />
          </div>

          {/* Meta Footer */}
          <div className={`text-center text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            <p>Created: {new Date(event.created_at).toLocaleDateString()}</p>
            <p className="mt-1">Order: {event.order}</p>
          </div>

        </div>
      </div>

      {/* Delete Modal Component */}
      <DeleteConfirmModal
        event={event}
        isOpen={showDeleteModal}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}