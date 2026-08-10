import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        const token = (session as any)?.accessToken;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const res = await fetch(`${BACKEND_URL}/users/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
    }
}
