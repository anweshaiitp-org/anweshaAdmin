import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(
    _req: NextRequest,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await props.params;

        const session = await auth();
        const token = (session as { accessToken?: string } | null)?.accessToken;

        const baseUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

        const response = await fetch(`${baseUrl}/admin/users/${encodeURIComponent(userId)}/ticket/restore`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error restoring user ticket:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
