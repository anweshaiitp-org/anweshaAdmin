import type {
  UserListResponse,
  InviteUserPayload,
  UpdateUserPayload,
  VerifyIdPayload
} from '@/types/users';

const BASE = '/api/admin/users';

export async function fetchUsers(params?: {
  limit?: number;
  lastKey?: string;
  search?: string;
  role?: string;
  college?: string;
}): Promise<UserListResponse> {
  const sp = new URLSearchParams();
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.lastKey) sp.set('lastKey', params.lastKey);
  if (params?.search) sp.set('search', params.search);
  if (params?.role) sp.set('role', params.role);
  if (params?.college) sp.set('college', params.college);

  const url = sp.toString() ? `${BASE}?${sp.toString()}` : BASE;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function inviteUser(data: InviteUserPayload): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to invite user');
  }
  return res.json();
}

export async function updateUser(userId: string, data: UpdateUserPayload): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update user');
  }
  return res.json();
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete user');
  }
  return res.json();
}

export async function requestIdCard(userId: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(userId)}/request-id`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to request ID card');
  }
  return res.json();
}

export async function verifyIdCard(userId: string, data: VerifyIdPayload): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(userId)}/verify-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to verify ID card');
  }
  return res.json();
}

export async function sendBroadcastEmail(anweshaIds: string[], subject: string, htmlContent: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audience: 'SPECIFIC', anweshaIds, subject, htmlContent }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send broadcast email');
  }
  return res.json();
}

export async function fetchUserDashboard(): Promise<any> {
  const res = await fetch(`${BASE}/dashboard`, { cache: 'no-store' });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch user dashboard data');
  }
  return res.json();
}
