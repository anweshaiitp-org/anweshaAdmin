export type PaymentStatus = 'paid' | 'unpaid' | string;


export interface SoloParticipant {
  registration_id: string;
  user_id: string;
  anwesha_id: string;

  full_name: string;
  email_id: string;
  collage_name: string;
  phone_number: string;

  payment_status: PaymentStatus;
  registration_status: string;
  has_attended: boolean;

  date_of_registration?: string;
}

export interface SoloRegistrationResponse {
  success: boolean;
  event_name: string;
  registration_type: 'solo';

  page: number;
  limit: number;

  total_registrations: number;
  total_pages: number;

  data: SoloParticipant[];
}


export interface TeamMember {
  registration_id: string;
  anwesha_id: string;

  full_name: string;
  email_id: string;
  phone_number: string;

  role: string;
  has_attended: boolean;
}


export interface TeamRegistration {
  team_id: string;
  team_name: string;

  leader_user_id: string;
  leader_anwesha_id: string;

  payment_status: PaymentStatus;
  registration_status: string;

  date_of_registration?: string;

  member_count: number;
  members: TeamMember[];
}

export interface TeamRegistrationResponse {
  success: boolean;
  event_name: string;
  registration_type: 'team';

  page: number;
  limit: number;

  total_registrations: number;
  total_pages: number;

  data: TeamRegistration[];
}


export type RegistrationResponse =
  | SoloRegistrationResponse
  | TeamRegistrationResponse;


export interface GlobalRegistrationItem {
  registration_type: 'solo' | 'team';

  event_id: string;
  event_name: string;
  is_special?: boolean;
  special_event_type?: string;

  registration_id?: string;
  user_id?: string;
  anwesha_id?: string;
  full_name?: string;


  team_id?: string;
  team_name?: string;
  leader_anwesha_id?: string;
  member_count?: number;

  payment_status: PaymentStatus;
  date_of_registration?: string;
}

export interface GlobalRegistrationsResponse {
  success: boolean;

  page: number;
  limit: number;

  total_registrations: number;
  total_pages: number;

  data: GlobalRegistrationItem[];
}



export interface EventWiseStat {
  event_id: string;
  event_name: string;

  type: 'solo' | 'team';

  fee: number;

  total_registrations: number;
  paid: number;
  unpaid: number;

  revenue: number;

  is_active: boolean;
  is_special?: boolean;
  special_event_type?: string;
}

export interface GlobalStats {
  total_registrations: number;

  paid: number;
  unpaid: number;

  revenue: number;

  solo_event_count: number;
  team_event_count: number;
  special_event_count?: number;
  special_event_registrations?: number;
  special_event_revenue?: number;

  zero_reg_events: string[];
}

export interface DashboardStatsResponse {
  success: boolean;

  global_stats: GlobalStats;

  event_wise_stats: EventWiseStat[];
}

export interface SoloRegistrationRow {
  registration_id: string;
  user_id: string;
  anwesha_id: string;
  full_name: string;
  email_id: string;
  collage_name: string;
  phone_number: string;
  payment_status: PaymentStatus;
  registration_status: string;
  has_attended: boolean;
  date_of_registration: string;
}

export interface EventRegistrationsResponse {
  success: boolean;
  event_name: string;
  registration_type: 'solo' | 'team';
  page: number;
  limit: number;
  total_registrations: number;
  total_pages: number;
  data: SoloRegistrationRow[] | any[]; // team rows shape from Flow 2 team branch
}

export interface TeamDetailsResponse {
  success: boolean;
  team: {
    team_id: string;
    team_name: string;
    event_id: string;
    event_name?: string;

    leader_user_id?: string;
    leader_anwesha_id?: string;

    payment_status: string;
    registration_status: string;

    date_of_registration?: string;

    member_count: number;

    members: {
      registration_id: string;
      anwesha_id: string;
      full_name: string;
      email_id: string;
      phone_number: string;
      role: string;
      has_attended: boolean;
    }[];
  };
}