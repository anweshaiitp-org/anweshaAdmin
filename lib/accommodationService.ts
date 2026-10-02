import type {
  AccommodationRequest,
  Room,
  AccommodationConfig,
  AccommodationStats,
  AllotRoomPayload,
  RejectRequestPayload,
  CreateRoomPayload,
  UpdateRoomPayload
} from '@/types/accommodation';

const BASE = '/api/admin/accommodation';

export async function fetchAccommodationQueue(status?: string, limit = 100): Promise<{ queue: AccommodationRequest[]; count: number }> {
  const sp = new URLSearchParams();
  if (status) sp.set('status', status);
  if (limit) sp.set('limit', limit.toString());

  const url = `${BASE}/queue?${sp.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch accommodation queue');
  }
  return res.json();
}

export async function fetchAccommodationStats(): Promise<{ stats: AccommodationStats }> {
  const res = await fetch(`${BASE}/stats`, { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch accommodation stats');
  }
  return res.json();
}

export async function fetchRooms(): Promise<{ rooms: Room[]; count: number }> {
  const res = await fetch(`${BASE}/rooms`, { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch rooms');
  }
  return res.json();
}

export async function createRoom(payload: CreateRoomPayload): Promise<{ room: Room }> {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create room');
  }
  return data;
}

export async function updateRoom(payload: UpdateRoomPayload): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update room');
  }
  return data;
}

export async function allotRoom(payload: AllotRoomPayload): Promise<{ message: string; payment_deadline: string; amount: number }> {
  const res = await fetch(`${BASE}/allot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to allot room');
  }
  return data;
}

export async function rejectAccommodationRequest(payload: RejectRequestPayload): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reject accommodation request');
  }
  return data;
}

export async function fetchAccommodationConfig(): Promise<{ config: AccommodationConfig }> {
  const res = await fetch(`${BASE}/config`, { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch accommodation config');
  }
  return res.json();
}

export async function updateAccommodationConfig(config: Partial<AccommodationConfig>): Promise<{ config: AccommodationConfig; message: string }> {
  const res = await fetch(`${BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update accommodation config');
  }
  return data;
}
