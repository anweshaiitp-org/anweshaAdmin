import type {
  UserProfile,
  EditProfilePayload,
  UploadUrlResponse,
  PhotoUrlResponse,
  ChangePasswordPayload,
} from '@/types/user';

import type {
  UserListResponse,
  InviteUserPayload,
  UpdateUserPayload,
  VerifyIdPayload,
} from '@/types/users';

const BASE = '/api/users';
const ADMIN_BASE = '/api/admin/users';

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {};

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
};

// ==================== USER PROFILE ====================

export async function fetchUserProfile(): Promise<{
  success: boolean;
  data: UserProfile;
}> {
  const res = await fetch(`${BASE}/profile`, {
    cache: 'no-store',
    headers: getAuthHeaders()
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.message || 'Failed to fetch profile details'
    );
  }

  return data;
}

export async function updateUserProfile(
  data: EditProfilePayload
): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(`${BASE}/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const resData = await res.json();

  if (!res.ok || !resData.success) {
    throw new Error(
      resData.message || 'Failed to update profile'
    );
  }

  return resData;
}

export async function fetchUserFullProfile(
  userId: string
): Promise<any> {
  const res = await fetch(
    `${ADMIN_BASE}/${encodeURIComponent(userId)}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store',
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.message || 'Failed to fetch user full profile'
    );
  }

  return data;
}

export async function getProfileUploadUrl(
  fileName: string,
  contentType: string
): Promise<UploadUrlResponse> {
  const sp = new URLSearchParams({
    fileName,
    contentType,
  });

  const res = await fetch(
    `${BASE}/profile/upload-url?${sp.toString()}`,
    { headers: getAuthHeaders() }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.message || 'Failed to generate upload URL'
    );
  }

  return data;
}

export async function uploadPhotoToS3(
  uploadUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error(
      'Failed to upload profile photo to storage'
    );
  }
}

export async function fetchProfilePhotoUrl(): Promise<PhotoUrlResponse> {
  const res = await fetch(`${BASE}/profile/photo-url`, {
    cache: 'no-store',
    headers: getAuthHeaders()
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.message ||
      'Failed to fetch profile photo viewing URL'
    );
  }

  return data;
}

export async function changeUserPassword(
    data: ChangePasswordPayload
): Promise<{
    success: boolean;
    message?: string;
}> {
    const res = await fetch(`${BASE}/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    const resData = await res.json();

    if (!res.ok || !resData.success) {
        throw new Error(
            resData.message || 'Failed to change password'
        );
    }

    return resData;
}

// ==================== ADMIN USER MANAGEMENT ====================

export async function fetchUsers(params?: {
  limit?: number;
  lastKey?: string;
  search?: string;
  role?: string;
  college?: string;
}): Promise<UserListResponse> {
  const sp = new URLSearchParams();

  if (params?.limit) {
    sp.set('limit', String(params.limit));
  }

  if (params?.lastKey) {
    sp.set('lastKey', params.lastKey);
  }

  if (params?.search) {
    sp.set('search', params.search);
  }

  if (params?.role) {
    sp.set('role', params.role);
  }

  if (params?.college) {
    sp.set('college', params.college);
  }

  const url = sp.toString()
    ? `${ADMIN_BASE}?${sp.toString()}`
    : ADMIN_BASE;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }

  return res.json();
}

// --------------------------------
// Dedicated Backend Admin User Search (/users/search)
// --------------------------------
export async function searchAdminUsers(params: {
  q?: string;
  search?: string;
  email?: string;
  name?: string;
  mobile?: string;
  doc?: string;
  limit?: number;
  lastKey?: string;
}): Promise<UserListResponse> {
  const sp = new URLSearchParams();

  const query = params.q || params.search;
  if (query) sp.set('q', query);
  if (params.email) sp.set('email', params.email);
  if (params.name) sp.set('name', params.name);
  if (params.mobile) sp.set('mobile_number', params.mobile);
  if (params.doc) sp.set('document_number', params.doc);
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.lastKey) sp.set('lastKey', params.lastKey);

  const url = `/api/admin/users/search?${sp.toString()}`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to search users');
  }

  return res.json();
}

// --------------------------------

export async function inviteUser(
  data: InviteUserPayload
): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(`${ADMIN_BASE}/invite`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    throw new Error(
      error.message || 'Failed to invite user'
    );
  }

  return res.json();
}

export async function updateUser(
  userId: string,
  data: UpdateUserPayload
): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(
    `${ADMIN_BASE}/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    throw new Error(
      error.message || 'Failed to update user'
    );
  }

  return res.json();
}

export async function deleteUser(
  userId: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(
    `${ADMIN_BASE}/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(true) // no Content-Type needed for DELETE
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    throw new Error(
      error.message || 'Failed to delete user'
    );
  }

  return res.json();
}

export async function requestIdCard(
  userId: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(
    `${ADMIN_BASE}/${encodeURIComponent(userId)}/request-id`,
    {
      method: 'POST',
      headers: getAuthHeaders(true)
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    throw new Error(
      error.message || 'Failed to request ID card'
    );
  }

  return res.json();
}

export async function verifyIdCard(
  userId: string,
  data: VerifyIdPayload
): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(
    `${ADMIN_BASE}/${encodeURIComponent(userId)}/verify-id`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    throw new Error(
      error.message || 'Failed to verify ID card'
    );
  }

  return res.json();
}

export async function fetchDocumentUrl(
  userId: string,
  type: 'profile' | 'id_card',
  mode: 'view' | 'download'
): Promise<{ success: boolean; url: string; message?: string }> {
  const sp = new URLSearchParams({ type, mode });
  
  const res = await fetch(`${ADMIN_BASE}/${encodeURIComponent(userId)}/document?${sp.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch document URL');
  }

  return data;
}

export async function sendBroadcastEmail(
  anweshaIds: string[],
  subject: string,
  htmlContent: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(`${ADMIN_BASE}/broadcast`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      audience: 'SPECIFIC',
      anweshaIds,
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    throw new Error(
      error.message || 'Failed to send broadcast email'
    );
  }

  return res.json();
}

export async function fetchUserDashboard(): Promise<any> {
  const res = await fetch(`${ADMIN_BASE}/dashboard`, {
    cache: 'no-store',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));

    throw new Error(
      error.message || 'Failed to fetch user dashboard data'
    );
  }

  return res.json();
}


// 1. Triggers the backend to generate the ticket and email it to the user
export async function generateAndEmailTicket(userId: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/ticket/generate`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate ticket');
    return data;
}

// 2. Fetches the ticket details and the encrypted QR token instantly for viewing
export async function fetchUserTicketDetails(userId: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/ticket`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch ticket details');
    return data;
}

// 3. Batch Broadcast Tickets to all registered attendees
export async function batchBroadcastTickets(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/tickets/broadcast', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to broadcast tickets');
  return data;
}

// 4. Submit Manual / Bulk Entry
export async function submitManualEntry(payload: {
  records?: any[];
  users?: any[];
  event_id?: string;
  amount_paid?: number;
  accommodation?: boolean;
} | any[]): Promise<{
  success: boolean;
  message?: string;
  results?: {
    totalProcessed: number;
    successful: number;
    failedCount: number;
    createdUsers: Array<{
      user_id: string;
      anwesha_id: string;
      email_id: string;
      full_name: string;
      event_id?: string;
      registration_id?: string;
    }>;
    failedRows: Array<{ record: any; reason: string }>;
  };
}> {
  const res = await fetch('/api/admin/manual-entry', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 207) {
    throw new Error(data.message || 'Failed to submit manual entry records');
  }
  return data;
}