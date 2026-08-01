'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchEvent } from '@/lib/eventService';
import type { Event } from '@/types/events';
import EventForm from '@/components/events/EventForm';
import { DetailSkeleton } from '@/components/events/EventLoadingSkeleton';
import ErrorState from '@/components/events/ErrorState';

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { isDarkMode } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const decodedId = decodeURIComponent(eventId);
      const res = await fetchEvent(decodedId);
      if (res.success) setEvent(res.event);
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!event) return <ErrorState message="Event not found" />;

  return (
    <div className="w-full space-y-6">
      <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
        Edit Event
      </h1>
      <EventForm initialData={event} />
    </div>
  );
}
