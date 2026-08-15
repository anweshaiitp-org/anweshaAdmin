import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Await the params to fix the Next.js sync dynamic API error
        const params = await props.params;
        const userId = params.userId;

        const session = await auth();
        const token = (session as any)?.accessToken;

        console.log("Token:", token);

        const baseUrl = process.env.BACKEND_URL;
        const adminBase = `${baseUrl}/admin/users`;

        const response = await fetch(`${adminBase}/${userId}/ticket`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching specific user ticket:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}