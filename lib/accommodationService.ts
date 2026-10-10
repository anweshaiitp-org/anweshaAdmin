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

const getAuthHeaders = (isFormData = false) => {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export async function fetchAccommodationQueue(
  status?: string,
  limit = 20,
  lastKey?: string | null
): Promise<{ queue: AccommodationRequest[]; count: number; lastKey?: string | null }> {
  const sp = new URLSearchParams();
  if (status) sp.set('status', status);
  if (limit) sp.set('limit', limit.toString());
  if (lastKey) sp.set('lastKey', lastKey);

  const url = `${BASE}/queue?${sp.toString()}`;
  const res = await fetch(url, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch accommodation queue');
  }
  return res.json();
}

export async function fetchAccommodationStats(): Promise<{ stats: AccommodationStats }> {
  const res = await fetch(`${BASE}/stats`, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch accommodation stats');
  }
  return res.json();
}

export async function fetchRooms(): Promise<{ rooms: Room[]; count: number }> {
  const res = await fetch(`${BASE}/rooms`, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch rooms');
  }
  return res.json();
}

export async function createRoom(payload: CreateRoomPayload): Promise<{ room: Room }> {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reject accommodation request');
  }
  return data;
}

export async function fetchAccommodationConfig(): Promise<{ config: AccommodationConfig }> {
  const res = await fetch(`${BASE}/config`, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch accommodation config');
  }
  return res.json();
}

export async function updateAccommodationConfig(config: Partial<AccommodationConfig>): Promise<{ config: AccommodationConfig; message: string }> {
  const res = await fetch(`${BASE}/config`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update accommodation config');
  }
  return data;
}

export async function autoAllotAccommodationRooms(): Promise<{
  success: boolean;
  count: number;
  unallotted_count: number;
  message: string;
  allotted: Array<{
    request_id: string;
    lead_user_id: string;
    room_id: string;
    room_number: string;
    gender: string;
    members_count: number;
    amount: number;
    payment_deadline: string;
  }>;
}> {
  const res = await fetch(`${BASE}/auto-allot`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to auto-allot rooms');
  }
  return data;
}
