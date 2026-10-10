import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'BACKEND_URL is not configured',
        },
        { status: 500 }
      );
    }

    const { userId } = await params;
    const decodedUserId = decodeURIComponent(userId);

    const type = req.nextUrl.searchParams.get('type') || 'id_card';
    const mode = req.nextUrl.searchParams.get('mode') || 'view';

    const sp = new URLSearchParams({ type, mode });

    const res = await fetch(
      `${BACKEND_URL}/admin/users/${encodeURIComponent(decodedUserId)}/document?${sp.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error: any) {
    console.error('Fetch user document URL error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Server Error',
      },
      { status: 500 }
    );
  }
}
