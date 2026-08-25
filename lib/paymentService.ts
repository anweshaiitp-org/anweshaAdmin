import type { PaymentAnalyticsResponse, PaymentListResponse } from '@/types/payment';

// Assumes you have created Next.js App Router API routes that call your Lambda/Backend
export const fetchPaymentAnalytics = async (): Promise<PaymentAnalyticsResponse> => {
  const res = await fetch('/api/admin/payment/analytics');
  if (!res.ok) throw new Error('Failed to fetch payment analytics');
  return res.json();
};

export const fetchPaymentList = async (cursor?: string | null, limit = 50): Promise<PaymentListResponse> => {
  const url = new URL('/api/admin/payment/list', window.location.origin);
  url.searchParams.append('limit', limit.toString());
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch payment list');
  return res.json();
};