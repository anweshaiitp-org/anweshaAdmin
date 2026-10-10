import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Strip trailing slash to prevent double-slash URLs (BACKEND_URL ends with /prod/)
const BASE = (process.env.BACKEND_URL ?? "").trim().replace(/\/+$/, "");

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    };

    // Try enriched pass-scan endpoint first.
    // Falls back to existing /admin/gate/scan if pass-scan isn't deployed yet (404).
    let response = await fetch(`${BASE}/admin/gate/pass-scan`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      response = await fetch(`${BASE}/admin/gate/scan`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Gate Pass Scan Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during gate pass scan" },
      { status: 500 }
    );
  }
}
