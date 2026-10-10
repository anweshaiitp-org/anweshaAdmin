import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_URL = (process.env.BACKEND_URL ?? "").trim().replace(/\/+$/, "");

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

    const response = await fetch(`${BACKEND_URL}/admin/gate/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Gate Scan Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during scan" },
      { status: 500 }
    );
  }
}
