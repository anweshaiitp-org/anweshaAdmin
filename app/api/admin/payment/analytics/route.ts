import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
    try {

        const session = await auth();
        const token = (session as any)?.accessToken || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }


        const searchParams = request.nextUrl.searchParams.toString();
        const url = `${BACKEND_URL}/payment/admin/analytics${searchParams ? `?${searchParams}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Failed to fetch analytics from API Gateway' },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Payment Analytics Route Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}