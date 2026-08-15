export interface User {
  id: string;
  anwesha_id?: string;
  email_id: string;
  full_name: string;
  phone_number?: string;
  college_name?: string;
  gender?: string;
  user_type: string; // e.g., 'STUDENT', 'PROFESSIONAL'
  role: string; // e.g., 'USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'
  is_locked: boolean;
  is_email_verified: boolean;
  id_card_status?: string; // 'PENDING', 'APPROVED', 'REJECTED'
  id_card_url?: string;
  dob?: string;
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
  full_name: string;
  assign_role: string;
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
  gender?: string;
  dob?: string;
  user_type?: string;
  is_email_verified?: boolean;
}

export interface VerifyIdPayload {
  action: 'APPROVE' | 'REJECT';
  reject_reason?: string;
}
