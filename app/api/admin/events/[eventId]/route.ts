import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const decodedId = decodeURIComponent(eventId);
  const session = await auth();
  const token = (session as any)?.accessToken;

  // We hit the events endpoint. If it doesn't filter by eventId properly, we will find it manually.
  const res = await fetch(`${BACKEND_URL}/events`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const data = await res.json();

  if (data.events && Array.isArray(data.events)) {
    const matchedEvent = data.events.find((e: any) => e.id === decodedId);
    if (matchedEvent) {
      return NextResponse.json({ success: true, event: matchedEvent }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }
  }

  if (data.event) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const decodedId = decodeURIComponent(eventId);
  const session = await auth();
  const token = (session as any)?.accessToken;
  const body = await req.text();

  const res = await fetch(`${BACKEND_URL}/events/${encodeURIComponent(decodedId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const decodedId = decodeURIComponent(eventId);
  const session = await auth();
  const token = (session as any)?.accessToken;

  const res = await fetch(`${BACKEND_URL}/events/${encodeURIComponent(decodedId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
