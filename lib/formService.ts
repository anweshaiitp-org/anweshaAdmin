import type {
  CustomFormSummary,
  CustomFormDetail,
  CreateFormPayload,
  UpdateFormPayload,
  FormRegistration
} from '@/types/forms';

const BASE = '/api/admin/forms';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

export async function fetchForms(): Promise<{
  success: boolean;
  forms: CustomFormSummary[];
  count: number;
}> {
  const res = await fetch(BASE, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch custom forms');
  }
  return data;
}

export async function fetchForm(formId: string): Promise<{
  success: boolean;
  form: CustomFormDetail;
  event?: any;
}> {
  const res = await fetch(`${BASE}/${encodeURIComponent(formId)}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch form details');
  }
  return data;
}

export async function createForm(payload: CreateFormPayload): Promise<{
  success: boolean;
  message?: string;
  form: CustomFormDetail;
}> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create custom form');
  }
  return data;
}

export async function updateForm(
  formId: string,
  payload: UpdateFormPayload
): Promise<{
  success: boolean;
  message?: string;
  form: CustomFormDetail;
}> {
  const res = await fetch(`${BASE}/${encodeURIComponent(formId)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update custom form');
  }
  return data;
}

export async function deleteForm(formId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const res = await fetch(`${BASE}/${encodeURIComponent(formId)}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete custom form');
  }
  return data;
}

export async function fetchFormRegistrations(formId: string): Promise<{
  success: boolean;
  form_id: string;
  total_registrations: number;
  registrations: FormRegistration[];
}> {
  const res = await fetch(`${BASE}/${encodeURIComponent(formId)}/registrations`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch form registrations');
  }
  return data;
}

export async function acceptFormApplications(
  formId: string,
  records: any[]
): Promise<{
  success: boolean;
  message?: string;
  results?: {
    totalProcessed: number;
    successful: number;
    failedCount: number;
    createdUsers: any[];
    failedRows: Array<{ record: any; reason: string }>;
  };
}> {
  const res = await fetch(`${BASE}/${encodeURIComponent(formId)}/applications`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ records })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 207) {
    throw new Error(data.message || 'Failed to accept form applications');
  }
  return data;
}
