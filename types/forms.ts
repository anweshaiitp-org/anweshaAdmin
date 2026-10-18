export interface CustomFormSummary {
  form_id: string;
  title?: string;
  event_id: string;
  event_name?: string;
  target_college?: string;
  max_capacity: number;
  current_uses: number;
  total_amount: number;
  is_prepaid: boolean;
  transaction_id?: string;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

export interface CustomFormDetail {
  form_id: string;
  event_id: string;
  created_by: string;
  title?: string;
  description?: string;
  target_college?: string;
  max_capacity: number;
  current_uses: number;
  total_amount: number;
  is_prepaid: boolean;
  linked_payment_id?: string;
  transaction_id?: string;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFormPayload {
  event_id: string;
  title?: string;
  description?: string;
  target_college?: string;
  max_capacity: number;
  total_amount?: number;
  is_prepaid?: boolean;
  linked_payment_id?: string;
  transaction_id?: string;
  transactionId?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface UpdateFormPayload {
  title?: string;
  description?: string;
  target_college?: string;
  max_capacity?: number;
  total_amount?: number;
  is_prepaid?: boolean;
  linked_payment_id?: string;
  transaction_id?: string;
  transactionId?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface FormRegistration {
  registration_id: string;
  user_id: string;
  anwesha_id: string;
  event_id: string;
  team_name?: string;
  full_name: string;
  email_id: string;
  phone_number: string;
  college_name: string;
  college_id_number?: string;
  dob?: string;
  aadhar_id_number?: string;
  college_id_card?: string;
  aadhar_card?: string;
  payment_status: string;
  amount_paid: number;
  registration_status: string;
  source: string;
  form_id?: string;
  date_of_registration: string;
  has_attended?: boolean;
  type: 'solo' | 'team';
}
