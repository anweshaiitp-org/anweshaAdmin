export type PaymentPurpose = 'FEST_PASS' | 'SOLO_EVENT' | 'TEAM_EVENT' | 'ACCOMMODATION' | 'MERCHANDISE';
export type PaymentStatus = 'PAID' | 'UNPAID' | 'FAILED' | 'PENDING';

export interface PaymentRecord {
  paymentId: string;
  domain: PaymentPurpose;
  amount: number;
  payment_status: PaymentStatus;
  payment_mode?: string;
  full_name: string;
  anwesha_id: string;
  created_at: string;
}

export interface PaymentAnalyticsResponse {
  success: boolean;
  totals: {
    count: number;
    paid_count: number;
    pending_count: number;
    failed_count: number;
    amount_paid: number;
  };
  overall_conversion_rate: number;
  gateway_insights: {
    top_payment_modes: Record<string, number>;
    failure_analysis: Record<string, number>;
  };
  by_domain: Record<PaymentPurpose, { count: number; paid_count: number; amount_paid: number }>;
}

export interface PaymentListResponse {
  success: boolean;
  total: number;
  next_cursor: string | null;
  payments: PaymentRecord[];
}