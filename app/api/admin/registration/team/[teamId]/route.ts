import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!teamId) {
    return NextResponse.json(
      {
        success: false,
        message: 'Team ID is required',
      },
      { status: 400 }
    );
  }

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

  try {
    const url =
      `${BACKEND_URL}/registration/team/` +
      encodeURIComponent(teamId);

    const backendRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await backendRes.json();

    return NextResponse.json(data, {
      status: backendRes.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Failed to fetch team details',
      },
      { status: 500 }
    );
  }
}