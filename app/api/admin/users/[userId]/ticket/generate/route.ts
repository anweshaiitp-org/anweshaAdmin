import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Await the params
        const params = await props.params;
        const userId = params.userId;

        const session = await auth();
        const token = (session as any)?.accessToken;
        
        // 2. Safely get the Base URL
       const baseUrl = process.env.BACKEND_URL ;
        const adminBase = `${baseUrl}/admin/users`;
        
        const response = await fetch(`${adminBase}/${userId}/ticket/generate`, {
            method: 'POST',
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
        console.error('Error generating specific user ticket:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}