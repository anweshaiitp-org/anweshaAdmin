export interface User {
  id: string;
  anwesha_id?: string;
  email_id: string;
  full_name: string;
  phone_number?: string;
  college_name?: string;
  collage_name?: string;
  gender?: string;
  user_type: string; // e.g., 'STUDENT', 'PROFESSIONAL'
  role: string; // e.g., 'USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'
  is_locked: boolean;
  is_email_verified: boolean;
  id_card_status?: string; // 'PENDING', 'APPROVED', 'REJECTED', 'UPLOADED', 'REQUESTED'
  id_card_url?: string;
  college_id_card?: string;
  college_id_number?: string;
  college_id_url?: string | null;
  aadhar_card?: string;
  aadhar_id_number?: string;
  aadhar_id_url?: string | null;
  dob?: string;
  mainGate_status?: 'INSIDE' | 'OUTSIDE';
  festArena_status?: 'INSIDE' | 'OUTSIDE';
  ticket_revoked_at?: string;
  accomadation_selected?: boolean;
  accommodation_selected?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  success: boolean;
  users: User[];
  pagination: {
    total?: number;
    limit: number;
    lastKey?: string;
    nextLastKey?: string;
  };
}

export interface InviteUserPayload {
  email_id: string;
  assign_role: string;
  full_name?: string;
  role?: string;
  phone_number?: string;
  college_name?: string;
  gender?: string;
  user_type?: string;
  dob?: string;
}

export interface UpdateUserPayload {
  role?: string;
  is_locked?: boolean;
  full_name?: string;
  phone_number?: string;
  college_name?: string;
  collage_name?: string;
  gender?: string;
  dob?: string;
  user_type?: string;
  is_email_verified?: boolean;
  accomadation_selected?: boolean;
  accommodation_selected?: boolean;
}

export interface VerifyIdPayload {
  action: 'APPROVE' | 'REJECT';
  reject_reason?: string;
}
