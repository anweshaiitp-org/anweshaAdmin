import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(
      `${BACKEND_URL}/auth/admin/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        code: "SERVER_UNAVAILABLE",
        message: "Authentication server unavailable",
      },
      {
        status: 500,
      }
    );
  }
}