// =============================================================================
// Event Service Types — Matches backend DynamoDB schema exactly
// See: services/events-service/Readme.md
// =============================================================================

export enum EventTag {
  CULTURAL = 'CULTURAL',
  TECH = 'TECH',
  SPORTS = 'SPORTS',
  ESPORTS = 'ESPORTS',
  WORKSHOP = 'WORKSHOP',
  GUEST_TALK = 'GUEST_TALK',
}

export enum SpecialEventType {
  FEST = 'FEST',
  FEST_PASS = 'FEST_PASS',
  GARBA = 'GARBA',
  PRONITE = 'PRONITE',
  FLAGSHIP = 'FLAGSHIP',
  OTHER = 'OTHER'
}

export interface Event {
  id: string;                    // PK: EVT#<uuid>
  name: string;                  // Name of the event
  organizer: string;             // Format: "Name:Role, Name2:Role2"
  venue?: string;                // Location of the event
  description?: string;          // HTML or Markdown description
  start_time?: string;           // ISO Timestamp string
  end_time?: string;             // ISO Timestamp string
  prize: string;                 // e.g., "10000" or "Exciting Goodies"
  registration_fee: number;      // Entry fee in INR (0 for free)
  registration_deadline?: string;// ISO Timestamp string
  video?: string;                // YouTube trailer link
  poster?: string;               // S3 Object Key
  tags?: EventTag[];             // Array of categories
  max_team_size: number;         // Max members allowed
  min_team_size: number;         // Min members required
  is_active: boolean;            // Visibility toggle
  is_online: boolean;            // Online vs Offline mode
  registration_link?: string;    // External registration link (if any)
  order: number;                 // Custom sorting priority
  is_special?: boolean;          // Flag indicating special event / fest pass
  special_event_type?: SpecialEventType; // FEST, FEST_PASS, GARBA, PRONITE, etc.
  ca_points?: number;            // Custom CA points awarded on registration
  created_at: number;            // Epoch timestamp
  updated_at: number;            // Epoch timestamp
}

/** Partial payload for creating/updating events */
export type EventFormData = Omit<Event, 'id' | 'created_at' | 'updated_at'>;

/** Parsed organizer tuple */
export type OrganizerEntry = [name: string, role: string];

// =============================================================================
// API Response Types
// =============================================================================

export interface EventsListResponse {
  success: boolean;
  events: Event[];
}

export interface EventDetailResponse {
  success: boolean;
  event: Event;
}

export interface EventAnalytics {
  total_events: number;
  regular_events?: number;
  special_events?: {
    total: number;
    by_type: Record<string, number>;
  };
  status: {
    active: number;
    inactive_hidden: number;
  };
  mode: {
    online: number;
    offline: number;
  };
  participation_type: {
    solo: number;
    group: number;
  };
  fee_structure: {
    free: number;
    paid: number;
  };
  categories: Record<string, number>;
  venues: Record<string, number>;
}

export interface AnalyticsResponse {
  success: boolean;
  analytics: EventAnalytics;
}

export interface PosterUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface PosterViewResponse {
  success: boolean;
  url: string;
}
