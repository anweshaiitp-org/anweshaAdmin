import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { getCachedIdStatus, setCachedIdStatus } from '@/lib/idCardCache';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const token = (session as any)?.accessToken || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

        if (!token || token === 'null' || token === 'undefined') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Forward all query parameters (limit, cursor, status, domain, anwesha_id, etc.)
        const searchParams = request.nextUrl.searchParams.toString();
        const url = `${BACKEND_URL}/payment/admin/list${searchParams ? `?${searchParams}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Failed to fetch payments from API Gateway' },
                { status: response.status }
            );
        }

        if (data?.success && Array.isArray(data.payments)) {
            const needsEnrichment = data.payments.some(
                (p: any) => p.id_card_status === undefined && (p.user_id || p.anwesha_id)
            );
            if (needsEnrichment) {
                await Promise.allSettled(
                    data.payments.map(async (payment: any) => {
                        const targetId = payment.user_id || payment.anwesha_id;
                        if (!targetId) return;
                        const cached = getCachedIdStatus(targetId);
                        if (cached !== undefined) {
                            payment.id_card_status = cached;
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
                                    payment.id_card_status = status;
                                    setCachedIdStatus(targetId, status);
                                    if (payment.anwesha_id) setCachedIdStatus(payment.anwesha_id, status);
                                    if (payment.user_id) setCachedIdStatus(payment.user_id, status);
                                }
                            }
                        } catch {
                            // ignore
                        }
                    })
                );
            }

            const idCardFilter = request.nextUrl.searchParams.get('id_card_status');
            if (idCardFilter && idCardFilter !== 'ALL') {
                const target = idCardFilter.toUpperCase();
                data.payments = data.payments.filter((payment: any) => {
                    const raw = (payment.id_card_status || 'NOT_UPLOADED').toUpperCase();
                    if (target === 'NOT_REQUIRED') {
                        return raw === 'NOT_REQUIRED';
                    }
                    if (target === 'NOT_UPLOADED') {
                        if (raw === 'NOT_REQUIRED') return false;
                        return !payment.id_card_status || raw === 'NOT_UPLOADED' || raw === 'NONE';
                    }
                    if (target === 'VERIFIED') {
                        return raw === 'VERIFIED' || raw === 'APPROVED';
                    }
                    if (target === 'PENDING') {
                        return raw === 'PENDING' || raw === 'REQUESTED';
                    }
                    return raw === target;
                });
            }
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Payment List Route Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}