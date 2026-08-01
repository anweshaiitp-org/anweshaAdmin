'use client';

import { useAuth } from '@/context/AuthContext';
import EventForm from '@/components/events/EventForm';

export default function AddEventPage() {
  const { isDarkMode } = useAuth();

  return (
    <div className="w-full space-y-6">
      <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#2563EB]'}`}>
        Create New Event
      </h1>
      <EventForm />
    </div>
  );
}
