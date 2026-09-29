export type PaymentPurpose = 'SPECIAL_EVENT' | 'FEST_PASS' | 'SOLO_EVENT' | 'TEAM_EVENT' | 'ACCOMMODATION' | 'MERCHANDISE';
export type PaymentStatus = 'PAID' | 'UNPAID' | 'FAILED' | 'PENDING' | 'CANCELLED';

export interface PaymentRecord {
  paymentId: string;
  merch_txn_id?: string;
  domain: PaymentPurpose;
  event_id?: string;
  team_id?: string;
  amount: number;
  amount_paid?: number;
  payment_status: PaymentStatus;
  payment_mode?: string;
  bank_name?: string;
  failure_reason?: string;
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

export interface PaymentDetail extends PaymentRecord {
  user_id?: string;
  atom_txn_id?: string | null;
  bank_txn_id?: string | null;
  updated_at?: string;
  email_id?: string;
  phone_number?: string;
  payer?: {
    user_id?: string;
    anwesha_id?: string;
    full_name?: string;
    email_id?: string;
    phone_number?: string;
    college_name?: string;
    user_type?: string;
    role?: string;
    is_email_verified?: boolean;
    id_card_status?: string;
  } | null;
  event?: {
    id: string;
    name: string;
    category?: string;
    is_special?: boolean;
    special_event_type?: string | null;
    registration_fee?: number;
    venue?: string;
    start_time?: string;
    end_time?: string;
  } | null;
  team?: {
    team_id: string;
    team_name: string;
    leader_anwesha_id: string;
    event_id: string;
    current_team_size: number;
    members: Array<{
      user_id: string;
      anwesha_id: string;
      team_role: string;
      payment_status: string;
    }>;
  } | null;
  raw?: any;
}

export interface PaymentDetailResponse {
  success: boolean;
  payment: PaymentDetail;
  message?: string;
}

export interface PaymentListResponse {
  success: boolean;
  total: number;
  next_cursor: string | null;
  payments: PaymentRecord[];
}