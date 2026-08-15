import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_URL = process.env.BACKEND_URL;

// GET: Fetch Single Broadcast
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ broadcastId: string }> }
) {
  try {
    const { broadcastId } = await params;
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const response = await fetch(`${BACKEND_URL}/admin/broadcast/${encodeURIComponent(broadcastId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch broadcast" }, { status: 500 });
  }
}

// PUT: Update / Send Existing Broadcast Draft
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ broadcastId: string }> }
) {
  try {
    const { broadcastId } = await params;
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/admin/broadcast/${encodeURIComponent(broadcastId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to update broadcast" }, { status: 500 });
  }
}