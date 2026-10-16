import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCachedIdStatus, setCachedIdStatus } from '@/lib/idCardCache';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  const { eventId } = await context.params;

  // Next.js params are not fully URL-decoded automatically for App Router
  // We need to decode it to handle characters like '#' in event IDs (e.g., EVT#001)
  const decodedEventId = decodeURIComponent(eventId);
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${BACKEND_URL}/registration/admin/${encodeURIComponent(decodedEventId)}${searchParams ? `?${searchParams}` : ''}`;

  const res = await fetch(
    targetUrl,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  );

  const responseText = await res.text();

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    data = { success: false, message: "Invalid backend response payload" };
  }

  if (data?.success && Array.isArray(data.data)) {
    if (data.registration_type === 'solo') {
      const needsEnrichment = data.data.some(
        (p: any) => p.id_card_status === undefined && (p.user_id || p.anwesha_id)
      );
      if (needsEnrichment) {
        await Promise.allSettled(
          data.data.map(async (p: any) => {
            const targetId = p.user_id || p.anwesha_id;
            if (!targetId) return;
            const cached = getCachedIdStatus(targetId);
            if (cached !== undefined) {
              p.id_card_status = cached;
              return;
            }
            try {
              const uRes = await fetch(`${BACKEND_URL}/admin/users/${encodeURIComponent(targetId)}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
              });
              if (uRes.ok) {
                const uData = await uRes.json();
                const status =
                  uData?.data?.profile?.id_card_status ||
                  uData?.profile?.id_card_status ||
                  uData?.user?.id_card_status ||
                  null;
                if (status) {
                  p.id_card_status = status;
                  setCachedIdStatus(targetId, status);
                  if (p.anwesha_id) setCachedIdStatus(p.anwesha_id, status);
                  if (p.user_id) setCachedIdStatus(p.user_id, status);
                }
              }
            } catch {
              // ignore
            }
          })
        );
      }

      const paymentStatusFilter = req.nextUrl.searchParams.get('payment_status');
      if (paymentStatusFilter && paymentStatusFilter !== 'ALL') {
        const pTarget = paymentStatusFilter.toUpperCase();
        data.data = data.data.filter((p: any) => (p.payment_status || '').toUpperCase() === pTarget);
        data.total_registrations = data.data.length;
      }

      const idCardFilter = req.nextUrl.searchParams.get('id_card_status');
      if (idCardFilter && idCardFilter !== 'ALL') {
        const target = idCardFilter.toUpperCase();
        data.data = data.data.filter((p: any) => {
          const raw = (p.id_card_status || 'NOT_UPLOADED').toUpperCase();
          if (target === 'NOT_REQUIRED') return raw === 'NOT_REQUIRED';
          if (target === 'NOT_UPLOADED') {
            if (raw === 'NOT_REQUIRED') return false;
            return !p.id_card_status || raw === 'NOT_UPLOADED' || raw === 'NONE';
          }
          if (target === 'VERIFIED') return raw === 'VERIFIED' || raw === 'APPROVED';
          if (target === 'PENDING') return raw === 'PENDING' || raw === 'REQUESTED';
          return raw === target;
        });
        data.total_registrations = data.data.length;
      }
    } else if (data.registration_type === 'team') {
      const paymentStatusFilter = req.nextUrl.searchParams.get('payment_status');
      if (paymentStatusFilter && paymentStatusFilter !== 'ALL') {
        const pTarget = paymentStatusFilter.toUpperCase();
        data.data = data.data.filter((t: any) => (t.payment_status || '').toUpperCase() === pTarget);
        data.total_registrations = data.data.length;
      }

      const idCardFilter = req.nextUrl.searchParams.get('id_card_status');
      if (idCardFilter && idCardFilter !== 'ALL') {
        const target = idCardFilter.toUpperCase();
        data.data = data.data.filter((t: any) => {
          if (!Array.isArray(t.members)) return true;
          return t.members.some((m: any) => {
            const raw = (m.id_card_status || 'NOT_UPLOADED').toUpperCase();
            if (target === 'NOT_REQUIRED') return raw === 'NOT_REQUIRED';
            if (target === 'NOT_UPLOADED') {
              if (raw === 'NOT_REQUIRED') return false;
              return !m.id_card_status || raw === 'NOT_UPLOADED' || raw === 'NONE';
            }
            if (target === 'VERIFIED') return raw === 'VERIFIED' || raw === 'APPROVED';
            if (target === 'PENDING') return raw === 'PENDING' || raw === 'REQUESTED';
            return raw === target;
          });
        });
        data.total_registrations = data.data.length;
      }
    }
  }

  return NextResponse.json(data, { status: res.status });
}
