import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";
import { auth } from "@/auth";

const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL) 
  : null;

const DRAFT_KEY = "broadcast:email:draft";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!redis) {
      console.warn("Redis is not configured.");
      return NextResponse.json({ design: null });
    }

    const draft = await redis.get(DRAFT_KEY);
    return NextResponse.json({ design: draft ? JSON.parse(draft) : null });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!redis) {
      console.warn("Redis is not configured.");
      return NextResponse.json({ success: true, warning: "Redis not configured" });
    }

    const body = await req.json();
    if (!body || !body.design) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Save draft and set expiration to 7 days
    await redis.set(DRAFT_KEY, JSON.stringify(body.design), "EX", 7 * 24 * 60 * 60);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
