import type {
    UserProfile,
    EditProfilePayload,
    UploadUrlResponse,
    PhotoUrlResponse,
    ChangePasswordPayload,
} from '@/types/user';

const BASE = '/api/users';

export async function fetchUserProfile(): Promise<{ success: boolean; data: UserProfile }> {
    const res = await fetch(`${BASE}/profile`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch profile details');
    return data;
}

export async function updateUserProfile(data: EditProfilePayload): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok || !resData.success) throw new Error(resData.message || 'Failed to update profile');
    return resData;
}

export async function getProfileUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResponse> {
    const sp = new URLSearchParams({ fileName, contentType });
    const res = await fetch(`${BASE}/profile/upload-url?${sp.toString()}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to generate upload URL');
    return data;
}

export async function uploadPhotoToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!res.ok) throw new Error('Failed to upload profile photo to storage');
}

export async function fetchProfilePhotoUrl(): Promise<PhotoUrlResponse> {
    const res = await fetch(`${BASE}/profile/photo-url`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch profile photo viewing URL');
    return data;
}

export async function changeUserPassword(payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to change password');
    }
    return data;
}
