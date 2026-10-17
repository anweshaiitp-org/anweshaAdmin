import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!BACKEND_URL) {
      return NextResponse.json({ success: false, message: 'BACKEND_URL is not configured' }, { status: 500 });
    }

    const { eventId } = await context.params;
    const decodedEventId = decodeURIComponent(eventId);
    const accommodation = req.nextUrl.searchParams.get('accommodation') || 'all';

    const targetUrl = `${BACKEND_URL}/registration/admin/${encodeURIComponent(decodedEventId)}/export?accommodation=${encodeURIComponent(accommodation)}`;
    console.log(`[Next.js API] Fetching export from backend: ${targetUrl}`);

    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const responseText = await res.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    const sortByName = (list: any[]) => {
      return list.sort((a, b) => {
        const nameA = (a?.full_name || '').trim();
        const nameB = (b?.full_name || '').trim();
        if (!nameA && !nameB) return 0;
        if (!nameA) return 1;
        if (!nameB) return -1;
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base', numeric: true });
      });
    };

    // If backend endpoint is active and responded
    if (res.ok && data?.success) {
      if (Array.isArray(data.data)) {
        sortByName(data.data);
      }
      return NextResponse.json(data, { status: 200 });
    }

    // If backend endpoint is not found (404), fall back to querying existing endpoints
    if (res.status === 404) {
      console.log(`[Next.js API] Direct export endpoint returned 404, attempting fallback enrichment for ${decodedEventId}`);
      
      const listRes = await fetch(`${BACKEND_URL}/registration/admin/${encodeURIComponent(decodedEventId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!listRes.ok) {
        return NextResponse.json(
          { success: false, message: 'Event registrations could not be retrieved' },
          { status: listRes.status }
        );
      }

      const listData = await listRes.json();
      const rawParticipants: any[] = Array.isArray(listData.data) ? listData.data : [];

      // Filter successful solo registrations only
      const successful = rawParticipants.filter((p) => {
        const pay = (p.payment_status || '').toLowerCase();
        const reg = (p.registration_status || '').toLowerCase();
        const isPaid = pay === 'paid' || pay === 'success';
        const isConfirmed = reg === 'confirmed' || reg === 'registered';
        const isPending = pay === 'pending' || reg === 'pending' || reg === 'cancelled';
        return (isPaid || isConfirmed) && !isPending;
      });

      // Enrich with user profile and document presigned URL
      const enriched = await Promise.all(
        successful.map(async (p) => {
          let userProfile: any = null;
          let docUrl: string | null = null;

          try {
            const userRes = await fetch(`${BACKEND_URL}/admin/users/${encodeURIComponent(p.user_id)}`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            });
            if (userRes.ok) {
              const uData = await userRes.json();
              userProfile = uData.data || uData.user || uData;
            }
          } catch (err) {
            console.error(`Error fetching user profile for ${p.user_id}:`, err);
          }

          try {
            const docRes = await fetch(
              `${BACKEND_URL}/admin/users/${encodeURIComponent(p.user_id)}/document?type=id_card&mode=view`,
              {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
              }
            );
            if (docRes.ok) {
              const dData = await docRes.json();
              docUrl = dData?.data?.url || dData?.url || null;
            }
          } catch (err) {
            console.error(`Error fetching document url for ${p.user_id}:`, err);
          }

          return {
            registration_id: p.registration_id,
            user_id: p.user_id,
            anwesha_id: p.anwesha_id,
            full_name: userProfile?.full_name || p.full_name || 'Participant',
            email_id: userProfile?.email_id || p.email_id || '',
            contact: userProfile?.phone_number || p.phone_number || '',
            phone_number: userProfile?.phone_number || p.phone_number || '',
            aadhar_id_number: userProfile?.aadhar_id_number || '',
            college_name: userProfile?.college_name || p.college_name || p.collage_name || '',
            accomadation_selected: Boolean(userProfile?.accomadation_selected),
            college_id_card: userProfile?.college_id_card || null,
            college_id_url: docUrl,
            payment_status: p.payment_status,
            registration_status: p.registration_status,
            has_attended: Boolean(p.has_attended),
            date_of_registration: p.date_of_registration,
          };
        })
      );

      // Filter accommodation
      let filtered = enriched;
      if (accommodation === 'with' || accommodation === 'yes' || accommodation === 'true') {
        filtered = enriched.filter((u) => u.accomadation_selected === true);
      } else if (accommodation === 'without' || accommodation === 'no' || accommodation === 'false') {
        filtered = enriched.filter((u) => u.accomadation_selected !== true);
      }

      sortByName(filtered);

      return NextResponse.json({
        success: true,
        event_id: decodedEventId,
        event_name: listData.event_name || 'Event',
        registration_type: 'solo',
        total_count: filtered.length,
        accommodation_filter: accommodation,
        data: filtered,
      });
    }

    return NextResponse.json(data || { success: false, message: 'Backend error' }, { status: res.status });
  } catch (error: any) {
    console.error('Admin export route handler error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
