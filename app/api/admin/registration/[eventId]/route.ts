import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  const { eventId } = await context.params;

  // Next.js params are not fully URL-decoded automatically for App Router
  // We need to decode it to handle characters like '#' in event IDs (e.g., EVT#001)
  const decodedEventId = decodeURIComponent(eventId);
  const targetUrl = `${BACKEND_URL}/registration/admin/${encodeURIComponent(decodedEventId)}`;
  console.log(`[Next.js API] registration fetching: ${targetUrl}`);

  const res = await fetch(
    targetUrl,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  );

  // DEBUG LOGGING
  const responseText = await res.text();
  console.log(`[Next.js API] Raw response from backend for ${decodedEventId}:`, responseText);

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error(`[Next.js API] Failed to parse backend response as JSON for ${decodedEventId}`);
    data = { success: false, message: "Invalid backend response payload" };
  }

  return NextResponse.json(data, { status: res.status });
}
