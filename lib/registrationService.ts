import type {
  RegistrationResponse,
  DashboardStatsResponse,
  GlobalRegistrationsResponse,
  EventRegistrationsResponse,
  TeamDetailsResponse,
  ExportRegistrationsResponse,
  ExitAttendeeResponse,
  ExitAllResponse,
  AdminEditRegistrationPayload,
  AdminDeleteRegistrationPayload,
} from '@/types/registration';

const BASE = '/api/admin/registration';

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }
  } catch {
    // Response was not JSON
  }

  return fallback;
}

/**
 * Full (unpaginated) fetch for a specific event. Kept for any legacy callers;
 * prefer fetchEventRegistrationsPaginated for new UI.
 */
export async function fetchEventRegistrations(
  eventId: string
): Promise<RegistrationResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to load registrations for event (${res.status})`
    );
    throw new Error(message);
  }

  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  const res = await fetch(`${BASE}/stats`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to load dashboard stats (${res.status})`
    );
    throw new Error(message);
  }

  return res.json();
}

export async function fetchAllRegistrations(
  page: number = 1,
  limit: number = 20,
  payment_status?: string,
  id_card_status?: string
): Promise<GlobalRegistrationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (payment_status && payment_status !== 'ALL') params.set('payment_status', payment_status);
  if (id_card_status && id_card_status !== 'ALL') params.set('id_card_status', id_card_status);

  const res = await fetch(`${BASE}?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to load registrations (${res.status})`
    );
    throw new Error(message);
  }

  return res.json();
}

/**
 * Paginated fetch for a single event's registrations (solo participants or
 * teams). Backs the "Event-wise" tab on /admin/registration/events.
 */
export async function fetchEventRegistrationsPaginated(
  eventId: string,
  page: number = 1,
  limit: number = 20,
  payment_status?: string,
  id_card_status?: string
): Promise<EventRegistrationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (payment_status && payment_status !== 'ALL') params.set('payment_status', payment_status);
  if (id_card_status && id_card_status !== 'ALL') params.set('id_card_status', id_card_status);

  const res = await fetch(
    `${BASE}/${encodeURIComponent(eventId)}?${params.toString()}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to load event registrations (${res.status})`
    );

    if (res.status === 404 || message.toLowerCase().includes('not found')) {
      return {
        success: true,
        event_name: 'Event',
        registration_type: 'solo',
        page: 1,
        limit,
        total_registrations: 0,
        total_pages: 0,
        data: [],
      };
    }

    throw new Error(message);
  }

  return res.json();
}


export async function fetchTeamDetails(
  teamId: string
): Promise<TeamDetailsResponse> {
  if (!teamId) {
    throw new Error('Team ID is required');
  }

  const res = await fetch(
    `/api/admin/registration/team/${encodeURIComponent(teamId)}`,
    {
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to load team (${res.status})`
    );

    throw new Error(message);
  }

  const data = await res.json();

  if (!data || typeof data !== 'object') {
    throw new Error(
      'Invalid team response received from backend'
    );
  }

  return data as TeamDetailsResponse;
}

/**
  * Fetch enriched successful event registrations for document dossier export (DOCX/PDF).
  * Includes participant details and presigned S3 ID card URLs.
  */
export async function fetchEventRegistrationsExport(
  eventId: string,
  accommodation: 'all' | 'with' | 'without' = 'all'
): Promise<ExportRegistrationsResponse> {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  const params = new URLSearchParams({
    accommodation,
  });

  const res = await fetch(
    `${BASE}/${encodeURIComponent(eventId)}/export?${params.toString()}`,
    {
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to load export data for event (${res.status})`
    );
    throw new Error(message);
  }

  const data = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid export response received from server');
  }

  return data as ExportRegistrationsResponse;
}

export async function exitAttendee(
  userId: string,
  eventId: string
): Promise<ExitAttendeeResponse> {
  const res = await fetch(`${BASE}/exit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, event_id: eventId }),
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to exit attendee (${res.status})`
    );
    throw new Error(message);
  }

  return res.json();
}

export async function exitEveryoneInside(
  eventId: string,
  dryRun: boolean
): Promise<ExitAllResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}/exit-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dry_run: dryRun }),
  });

  if (!res.ok) {
    const message = await getErrorMessage(
      res,
      `Failed to exit attendees (${res.status})`
    );
    throw new Error(message);
  }

  return res.json();
}

export async function adminEditRegistration(
  payload: AdminEditRegistrationPayload
): Promise<{ success: boolean; message: string; data?: any }> {
  const res = await fetch(BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await getErrorMessage(res, `Failed to edit registration (${res.status})`);
    throw new Error(message);
  }

  return res.json();
}

export async function adminDeleteRegistration(
  payload: AdminDeleteRegistrationPayload
): Promise<{ success: boolean; message: string; members_deleted?: number }> {
  const res = await fetch(BASE, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await getErrorMessage(res, `Failed to delete registration (${res.status})`);
    throw new Error(message);
  }

  return res.json();
}