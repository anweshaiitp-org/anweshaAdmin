import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BASE = (process.env.BACKEND_URL ?? "").trim().replace(/\/+$/, "");

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await fetch(`${BASE}/admin/users/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      next: { revalidate: 30 } // Cache for 30s to avoid DB spam
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      gateStats: data.data?.gateStats || data.gateStats || {}
    });
  } catch (error) {
    console.error("Gate Stats Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error fetching stats" },
      { status: 500 }
    );
  }
}
