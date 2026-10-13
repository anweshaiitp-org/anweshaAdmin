import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    const token = (session as { accessToken?: string } | null)?.accessToken;
    const { eventId } = await context.params;
    const baseUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
    const body = await req.text();

    const response = await fetch(
      `${baseUrl}/registration/admin/${encodeURIComponent(decodeURIComponent(eventId))}/exit-all`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
        cache: 'no-store',
      }
    );

    const data = await response.json().catch(() => ({ success: false, message: 'Invalid backend response payload' }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error exiting all attendees:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
