import type { PaymentAnalyticsResponse, PaymentListResponse, PaymentDetailResponse, AdminUpdatePaymentPayload } from '@/types/payment';

// Assumes you have created Next.js App Router API routes that call your Lambda/Backend
export const fetchPaymentAnalytics = async (): Promise<PaymentAnalyticsResponse> => {
  const res = await fetch('/api/admin/payment/analytics');
  if (!res.ok) throw new Error('Failed to fetch payment analytics');
  return res.json();
};

export interface PaymentListFilterParams {
  cursor?: string | null;
  limit?: number;
  domain?: string;
  status?: string;
  search?: string;
}

export const fetchPaymentList = async (params: PaymentListFilterParams = {}): Promise<PaymentListResponse> => {
  const { cursor, limit = 50, domain, status, search } = params;
  const url = new URL('/api/admin/payment/list', window.location.origin);
  url.searchParams.append('limit', limit.toString());
  if (cursor) url.searchParams.append('cursor', cursor);
  if (domain && domain !== 'ALL') url.searchParams.append('domain', domain);
  if (status && status !== 'ALL') url.searchParams.append('status', status);
  if (search) url.searchParams.append('search', search);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch payment list');
  return res.json();
};

export const fetchPaymentDetails = async (paymentId: string): Promise<PaymentDetailResponse> => {
  const res = await fetch(`/api/admin/payment/${encodeURIComponent(paymentId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || 'Failed to fetch payment details');
  }
  return res.json();
};

export const adminUpdatePayment = async (
  paymentId: string,
  payload: AdminUpdatePaymentPayload
): Promise<{ success: boolean; message: string; payment?: any }> => {
  const res = await fetch(`/api/admin/payment/${encodeURIComponent(paymentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Failed to update payment (${res.status})`);
  }

  return res.json();
};

export const adminDeletePayment = async (
  paymentId: string
): Promise<{ success: boolean; message: string; deleted_payment_id?: string }> => {
  const res = await fetch(`/api/admin/payment/${encodeURIComponent(paymentId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Failed to delete payment (${res.status})`);
  }

  return res.json();
};