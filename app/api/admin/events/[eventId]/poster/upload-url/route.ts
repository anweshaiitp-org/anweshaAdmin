import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const decodedId = decodeURIComponent(eventId);
  const session = await auth();
  const token = (session as any)?.accessToken;
  
  const url = `${BACKEND_URL}/events/${encodeURIComponent(decodedId)}/poster/upload-url${req.nextUrl.search}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
