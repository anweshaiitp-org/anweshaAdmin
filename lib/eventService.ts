// =============================================================================
// Event Service — API client for all event operations
// Calls our Next.js API proxy routes which forward to the real backend.
// =============================================================================

import type {
  Event,
  EventFormData,
  EventsListResponse,
  EventDetailResponse,
  AnalyticsResponse,
  PosterUploadUrlResponse,
  PosterViewResponse,
} from '@/types/events';

const BASE = '/api/admin/events';

// ---------------------------------------------------------------------------
// List Events
// ---------------------------------------------------------------------------
export async function fetchEvents(params?: {
  tag?: string;
  status?: string;
  search?: string;
}): Promise<EventsListResponse> {
  const sp = new URLSearchParams();
  if (params?.tag) sp.set('tag', params.tag);
  if (params?.status) sp.set('status', params.status);
  if (params?.search) sp.set('search', params.search);

  const url = sp.toString() ? `${BASE}?${sp.toString()}` : BASE;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

// ---------------------------------------------------------------------------
// Get Single Event
// ---------------------------------------------------------------------------
export async function fetchEvent(eventId: string): Promise<EventDetailResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch event');
  return res.json();
}

// ---------------------------------------------------------------------------
// Create Event
// ---------------------------------------------------------------------------
export async function createEvent(data: Partial<EventFormData>): Promise<EventDetailResponse> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

// ---------------------------------------------------------------------------
// Update Event
// ---------------------------------------------------------------------------
export async function updateEvent(
  eventId: string,
  data: Partial<EventFormData>
): Promise<EventDetailResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update event');
  return res.json();
}

// ---------------------------------------------------------------------------
// Delete Event
// ---------------------------------------------------------------------------
export async function deleteEvent(eventId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete event');
  return res.json();
}

// ---------------------------------------------------------------------------
// Fetch Analytics
// ---------------------------------------------------------------------------
export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${BASE}/analytics`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// ---------------------------------------------------------------------------
// S3 Poster Upload Flow (3-step)
// ---------------------------------------------------------------------------

/** Step 1: Get presigned upload URL from backend */
export async function getPosterUploadUrl(
  eventId: string,
  fileName: string,
  contentType: string
): Promise<PosterUploadUrlResponse> {
  const sp = new URLSearchParams({ fileName, contentType });
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}/poster/upload-url?${sp.toString()}`);
  if (!res.ok) throw new Error('Failed to get upload URL');
  return res.json();
}

/** Step 2: Upload file directly to S3 presigned URL */
export async function uploadPosterToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Failed to upload poster to S3');
}

/** Step 3: Confirm upload in backend (saves fileKey to event record) */
export async function confirmPosterUpload(
  eventId: string,
  fileKey: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}/poster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileKey }),
  });
  if (!res.ok) throw new Error('Failed to confirm poster upload');
  return res.json();
}

/** Get poster viewing URL */
export async function getEventPosterUrl(eventId: string): Promise<PosterViewResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}/poster`);
  if (!res.ok) throw new Error('Failed to get poster URL');
  return res.json();
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Parse organizer string "Name:Role, Name2:Role2" into array of tuples */
export function parseOrganizers(organizer: string): [string, string][] {
  if (!organizer) return [];
  return organizer.split(',').map((entry) => {
    const [name, role] = entry.trim().split(':');
    return [name?.trim() || '', role?.trim() || ''];
  });
}
