import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ paymentId: string }> }
) {
  const params = await props.params;
  const { paymentId } = params;

  if (!paymentId) {
    return NextResponse.json({ success: false, message: 'Payment ID is required' }, { status: 400 });
  }

  try {
    const session = await auth();
    const token = (session as any)?.accessToken || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 1. Try direct backend payment detail endpoint
    try {
      const url = `${BACKEND_URL}/payment/admin/${encodeURIComponent(paymentId)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        headers,
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success && data?.payment) {
          return NextResponse.json(data, { status: 200 });
        }
      }
    } catch (directErr) {
      console.warn(`Direct payment detail fetch failed for ${paymentId}:`, directErr);
    }

    // 2. Fallback: Search in backend payment list by merch_txn_id or list scan
    if (token) {
      try {
        let matchedPayment: any = null;

        // Try querying by merch_txn_id
        const listByMerchUrl = `${BACKEND_URL}/payment/admin/list?merch_txn_id=${encodeURIComponent(paymentId)}`;
        const listRes = await fetch(listByMerchUrl, { headers, cache: 'no-store' });
        if (listRes.ok) {
          const listData = await listRes.json().catch(() => null);
          if (listData?.payments && listData.payments.length > 0) {
            matchedPayment = listData.payments[0];
          }
        }

        // If not found, scan latest payments to locate paymentId
        if (!matchedPayment) {
          const scanUrl = `${BACKEND_URL}/payment/admin/list?limit=100`;
          const scanRes = await fetch(scanUrl, { headers, cache: 'no-store' });
          if (scanRes.ok) {
            const scanData = await scanRes.json().catch(() => null);
            if (scanData?.payments) {
              matchedPayment = scanData.payments.find(
                (p: any) => p.paymentId === paymentId || p.merch_txn_id === paymentId
              );
            }
          }
        }

        if (matchedPayment) {
          // Enrich event if event_id is present
          let eventDetails: any = null;
          if (matchedPayment.event_id) {
            try {
              const evRes = await fetch(`${BACKEND_URL}/events/${encodeURIComponent(matchedPayment.event_id)}`, {
                headers,
                cache: 'no-store'
              });
              if (evRes.ok) {
                const evData = await evRes.json().catch(() => null);
                if (evData?.event) eventDetails = evData.event;
              }
            } catch (e) {
              console.warn(`Failed to enrich event ${matchedPayment.event_id}:`, e);
            }
          }

          // Enrich user if user_id is present
          let payerDetails: any = null;
          if (matchedPayment.user_id) {
            try {
              const userRes = await fetch(`${BACKEND_URL}/admin/users/${encodeURIComponent(matchedPayment.user_id)}`, {
                headers,
                cache: 'no-store'
              });
              if (userRes.ok) {
                const userData = await userRes.json().catch(() => null);
                const u = userData?.user || userData?.data?.user || userData?.data;
                if (u) {
                  payerDetails = {
                    user_id: u.user_id || matchedPayment.user_id,
                    anwesha_id: u.anwesha_id || matchedPayment.anwesha_id,
                    full_name: u.full_name || matchedPayment.full_name,
                    email_id: u.email_id || matchedPayment.email_id,
                    phone_number: u.phone_number || matchedPayment.phone_number,
                    college_name: u.college_name || u.collage_name,
                    user_type: u.user_type,
                    role: u.role,
                    is_email_verified: u.is_email_verified,
                    id_card_status: u.id_card_status
                  };
                }
              }
            } catch (e) {
              console.warn(`Failed to enrich user ${matchedPayment.user_id}:`, e);
            }
          }

          const assembledDetail = {
            paymentId: matchedPayment.paymentId,
            merch_txn_id: matchedPayment.merch_txn_id,
            domain: matchedPayment.domain,
            event_id: matchedPayment.event_id || null,
            team_id: matchedPayment.team_id || null,
            user_id: matchedPayment.user_id,
            anwesha_id: matchedPayment.anwesha_id || payerDetails?.anwesha_id || 'Unknown',
            amount: matchedPayment.amount,
            amount_paid: matchedPayment.amount_paid ?? matchedPayment.amount,
            payment_status: matchedPayment.payment_status,
            atom_txn_id: matchedPayment.atom_txn_id || null,
            bank_txn_id: matchedPayment.bank_txn_id || null,
            payment_mode: matchedPayment.payment_mode || null,
            bank_name: matchedPayment.bank_name || null,
            failure_reason: matchedPayment.failure_reason || null,
            created_at: matchedPayment.created_at,
            updated_at: matchedPayment.updated_at,
            full_name: matchedPayment.full_name || payerDetails?.full_name || 'N/A',
            email_id: matchedPayment.email_id || payerDetails?.email_id || '',
            phone_number: matchedPayment.phone_number || payerDetails?.phone_number || '',
            payer: payerDetails || {
              user_id: matchedPayment.user_id,
              anwesha_id: matchedPayment.anwesha_id,
              full_name: matchedPayment.full_name,
              email_id: matchedPayment.email_id,
              phone_number: matchedPayment.phone_number
            },
            event: eventDetails,
            raw: matchedPayment
          };

          return NextResponse.json({ success: true, payment: assembledDetail }, { status: 200 });
        }
      } catch (listErr) {
        console.warn('Fallback list lookup failed:', listErr);
      }
    }

    return NextResponse.json(
      { success: false, message: `Payment details not found for ID: ${paymentId}` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error(`Payment detail error for ${paymentId}:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ paymentId: string }> }
) {
  const params = await props.params;
  const { paymentId } = params;

  if (!paymentId) {
    return NextResponse.json({ success: false, message: 'Payment ID is required' }, { status: 400 });
  }

  const session = await auth();
  const token = (session as any)?.accessToken || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const url = `${BACKEND_URL}/payment/admin/${encodeURIComponent(paymentId)}`;
    const backendRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update payment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ paymentId: string }> }
) {
  const params = await props.params;
  const { paymentId } = params;

  if (!paymentId) {
    return NextResponse.json({ success: false, message: 'Payment ID is required' }, { status: 400 });
  }

  const session = await auth();
  const token = (session as any)?.accessToken || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = `${BACKEND_URL}/payment/admin/${encodeURIComponent(paymentId)}`;
    const backendRes = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
