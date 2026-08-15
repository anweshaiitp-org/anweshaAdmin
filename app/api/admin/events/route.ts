import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  const url = `${BACKEND_URL}/events${req.nextUrl.search}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  const body = await req.text();

  const res = await fetch(`${BACKEND_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
