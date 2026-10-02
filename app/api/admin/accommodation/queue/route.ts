import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const getBackendUrl = () => (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken || request.headers.get('authorization')?.replace('Bearer ', '');

    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${getBackendUrl()}/admin/accommodation/queue${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch accommodation queue' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Accommodation Queue Route Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
