import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCachedIdStatus, setCachedIdStatus } from '@/lib/idCardCache';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/registration/admin${searchParams ? `?${searchParams}` : ''}`;

    try {
        const backendRes = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        const data = await backendRes.json();

        if (data?.success && Array.isArray(data.data)) {
            const needsEnrichment = data.data.some(
                (item: any) => item.registration_type === 'solo' && item.id_card_status === undefined && (item.user_id || item.anwesha_id)
            );
            if (needsEnrichment) {
                await Promise.allSettled(
                    data.data.map(async (item: any) => {
                        if (item.registration_type !== 'solo') return;
                        const targetId = item.user_id || item.anwesha_id;
                        if (!targetId) return;
                        const cached = getCachedIdStatus(targetId);
                        if (cached !== undefined) {
                            item.id_card_status = cached;
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
                                    item.id_card_status = status;
                                    setCachedIdStatus(targetId, status);
                                    if (item.anwesha_id) setCachedIdStatus(item.anwesha_id, status);
                                    if (item.user_id) setCachedIdStatus(item.user_id, status);
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
                data.data = data.data.filter((item: any) => (item.payment_status || '').toUpperCase() === pTarget);
                data.total_registrations = data.data.length;
            }

            const idCardFilter = req.nextUrl.searchParams.get('id_card_status');
            if (idCardFilter && idCardFilter !== 'ALL') {
                const target = idCardFilter.toUpperCase();
                data.data = data.data.filter((item: any) => {
                    if (item.registration_type === 'team') return true;
                    const raw = (item.id_card_status || 'NOT_UPLOADED').toUpperCase();
                    if (target === 'NOT_REQUIRED') return raw === 'NOT_REQUIRED';
                    if (target === 'NOT_UPLOADED') {
                        if (raw === 'NOT_REQUIRED') return false;
                        return !item.id_card_status || raw === 'NOT_UPLOADED' || raw === 'NONE';
                    }
                    if (target === 'VERIFIED') return raw === 'VERIFIED' || raw === 'APPROVED';
                    if (target === 'PENDING') return raw === 'PENDING' || raw === 'REQUESTED';
                    return raw === target;
                });
                data.total_registrations = data.data.length;
            }
        }

        return NextResponse.json(data, { status: backendRes.status });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message || 'Failed to fetch registrations' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const url = `${BACKEND_URL}/registration/admin`;
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
            { success: false, message: err.message || 'Failed to update registration' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        let body: any = null;
        try {
            body = await req.json();
        } catch {
            body = null;
        }

        const queryString = searchParams.toString();
        const url = queryString ? `${BACKEND_URL}/registration/admin?${queryString}` : `${BACKEND_URL}/registration/admin`;

        const backendRes = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message || 'Failed to delete registration' },
            { status: 500 }
        );
    }
}