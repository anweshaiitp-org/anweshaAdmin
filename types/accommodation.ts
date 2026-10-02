export enum AccommodationStatus {
  REQUESTED = 'REQUESTED',
  ALLOTTED_PENDING_PAYMENT = 'ALLOTTED_PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED_DUE_TO_NON_PAYMENT = 'CANCELLED_DUE_TO_NON_PAYMENT',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface Room {
  id: string;
  room_number: string;
  gender: 'MALE' | 'FEMALE';
  total_capacity: number;
  current_occupancy: number;
  status: 'ACTIVE' | 'INACTIVE';
  address: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccommodationRequest {
  id: string;
  lead_user_id: string;
  group_members: string[];
  total_males: number;
  total_females: number;
  from_date: string;
  to_date: string;
  mess_addons: boolean;
  reason?: string;
  status: AccommodationStatus;
  allotted_room_id?: string;
  payment_deadline?: string;
  created_at: string;
  updated_at?: string;
  rejection_reason?: string;
  amount?: number;
  payment_status?: string;
  payment_id?: string;
  payment_verified_at?: string;
  room?: {
    room_id: string;
    room_number: string;
    gender: string;
    address: string;
    current_occupancy?: number;
    total_capacity?: number;
  } | null;
}

export interface AccommodationConfig {
  id: string;
  is_requests_open: boolean;
  payment_deadline_hours: number;
  global_male_capacity: number;
  global_female_capacity: number;
  cost_per_day?: number;
  updated_at?: string;
  updated_by?: string;
}

export interface AccommodationStats {
  rooms: {
    total_rooms: number;
    active_rooms: number;
    total_capacity: number;
    current_occupancy: number;
    available_capacity: number;
    male: {
      capacity: number;
      occupancy: number;
      available: number;
    };
    female: {
      capacity: number;
      occupancy: number;
      available: number;
    };
  };
  requests: {
    total_requests: number;
    by_status: Record<string, number>;
    total_revenue_collected: number;
  };
  config: {
    is_requests_open: boolean;
    payment_deadline_hours: number;
    cost_per_day: number;
  };
}

export interface AllotRoomPayload {
  request_id: string;
  room_id: string;
  custom_amount?: number;
  custom_deadline_hours?: number;
}

export interface RejectRequestPayload {
  request_id: string;
  reason?: string;
}

export interface CreateRoomPayload {
  room_number: string;
  gender: 'MALE' | 'FEMALE';
  total_capacity: number;
  address: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateRoomPayload {
  room_id: string;
  room_number?: string;
  gender?: 'MALE' | 'FEMALE';
  total_capacity?: number;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
