import type {
  RegistrationResponse,
  DashboardStatsResponse,
  GlobalRegistrationsResponse,
  EventRegistrationsResponse,
  TeamDetailsResponse,
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
  limit: number = 20
): Promise<GlobalRegistrationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

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
  limit: number = 20
): Promise<EventRegistrationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

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