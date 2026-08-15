import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
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

  const url = `${BACKEND_URL}/registration/admin/stats`;

  try {
    const backendRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    let data: unknown;

    try {
      data = await backendRes.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid response from backend (${backendRes.status})`,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data, {
      status: backendRes.status,
    });
  } catch (error) {
    console.error('[Next.js Stats API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch registration stats',
      },
      { status: 500 }
    );
  }
}