import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    const url = `${BACKEND_URL}/registration/admin?page=${page}&limit=${limit}`;
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const backendRes = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        const data = await backendRes.json();

        return NextResponse.json(data, { status: backendRes.status });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message || 'Failed to fetch registrations' },
            { status: 500 }
        );
    }
}