// src/app/api/admin/broadcast/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';


const BACKEND_URL = process.env.BACKEND_URL; 

// GET: Fetch Paginated Broadcast List
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "10";
    const lastKey = searchParams.get("lastKey") || "";

    const query = new URLSearchParams({ limit });
    if (lastKey) query.append("lastKey", lastKey);

    const response = await fetch(`${BACKEND_URL}/admin/broadcast?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch broadcasts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. Get auth token consistently using NextAuth session
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized: No valid session token" }, { status: 401 });
    }

    // 2. Forward the request to your AWS API Gateway backend
    const response = await fetch(`${BACKEND_URL}/admin/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // 3. Handle backend errors gracefully
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to queue emails" }, 
        { status: response.status }
      );
    }

    // 4. Return success to the frontend
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Broadcast API Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error proxying request" }, 
      { status: 500 }
    );
  }
}