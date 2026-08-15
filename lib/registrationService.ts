import type { RegistrationResponse } from '@/types/registration';

const BASE = '/api/admin/registration';

/**
 * Fetch all registrations for a specific event (admin-only).
 * Returns solo or team data depending on event type.
 */
export async function fetchEventRegistrations(
  eventId: string
): Promise<RegistrationResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    let message = 'Entry data error';
    try {
      const errData = await res.json();
      if (errData && errData.message) {
        message = errData.message;
      }
    } catch (e) {}

    // PATCH: Gracefully handle 'Event not found' or 404 responses
    if (res.status === 404 || message.toLowerCase().includes('not found')) {
      return {
        success: true, // Mark as successful so the UI renders it as an empty state
        registration_type: 'solo', // Safe default fallback
        participants: [],
        teams: [],
        total_registrations: 0,
        paid_count: 0,
        total_teams: 0,
        paid_teams: 0,
      } as any;
    }

    throw new Error(message);
  }
  
  return res.json();
}
