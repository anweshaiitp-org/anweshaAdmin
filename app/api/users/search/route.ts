import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  const url = `${BACKEND_URL}/users/search${req.nextUrl.search}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(err, { status: res.status });
    }

    const backendData = await res.json();

    const formattedData = {
      success: backendData.success,
      count: backendData.count,
      users: (backendData.data || []).map((u: any) => ({
        ...u,
        id: u.user_id
      })),
      pagination: {
        limit: parseInt(req.nextUrl.searchParams.get('limit') || '20', 10),
        nextLastKey: backendData.nextKey
      }
    };

    return NextResponse.json(formattedData, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
