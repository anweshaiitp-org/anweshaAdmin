import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const getBackendUrl = () => (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken || request.headers.get('authorization')?.replace('Bearer ', '');

    const url = `${getBackendUrl()}/admin/accommodation/config`;

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
        { success: false, message: data.message || 'Failed to fetch accommodation config' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Accommodation Config GET Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken || request.headers.get('authorization')?.replace('Bearer ', '');

    const body = await request.json();
    const url = `${getBackendUrl()}/admin/accommodation/config`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to update accommodation config' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Accommodation Config PUT Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
