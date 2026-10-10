import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const getBackendUrl = () => (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token || token === 'null' || token === 'undefined') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = `${getBackendUrl()}/admin/accommodation/reject`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to reject request' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Accommodation Reject Route Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
