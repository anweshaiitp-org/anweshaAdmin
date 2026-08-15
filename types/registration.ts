// Solo participant (from admin list response)
export interface SoloParticipant {
  anwesha_id: string;
  full_name: string;
  email_id: string;
  collage_name: string;
  phone_number: string;
  payment_done: boolean;
  has_entered: boolean;
}

// Team member (nested inside TeamRegistration)
export interface TeamMember {
  anwesha_id: string;
  full_name: string;
  email_id: string;
  collage_name: string;
  phone_number: string;
  is_leader: boolean;
  has_entered: boolean;
}

// Team registration entry
export interface TeamRegistration {
  team_id: string;
  team_name: string;
  leader_id: string;
  payment_done: boolean;
  member_count: number;
  members: TeamMember[];
}

// Solo event response
export interface SoloRegistrationResponse {
  success: boolean;
  event_name: string;
  event_id: string;
  registration_type: 'solo';
  total_registrations: number;
  paid_count: number;
  participants: SoloParticipant[];
}

// Team event response
export interface TeamRegistrationResponse {
  success: boolean;
  event_name: string;
  event_id: string;
  registration_type: 'team';
  total_teams: number;
  total_participants: number;
  paid_teams: number;
  teams: TeamRegistration[];
}

// Discriminated union for the endpoint response
export type RegistrationResponse = SoloRegistrationResponse | TeamRegistrationResponse;
