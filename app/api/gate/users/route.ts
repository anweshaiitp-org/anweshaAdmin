import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BASE = (process.env.BACKEND_URL ?? "").trim().replace(/\/+$/, "");

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const gate = (searchParams.get("gate") || "MAIN_GATE").toUpperCase().trim();
    const status = (searchParams.get("status") || "INSIDE").toUpperCase().trim();
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // Query backend users endpoint with gate & status & all=true
    const backendUrl = `${BASE}/admin/users?gate=${encodeURIComponent(gate)}&status=${encodeURIComponent(status)}&all=true`;

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: err.message || `Backend error ${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    let rawList: any[] = json.data || json.users || [];

    // Safety fallback: if backend didn't filter by gate status, filter client-side here
    const statusField = gate === "FEST_ARENA" ? "festArena_status" : "mainGate_status";
    let filtered = rawList.filter((u: any) => {
      const userGateStatus = u[statusField];
      // If backend already filtered, userGateStatus might match or be omitted if not projected
      if (userGateStatus) {
        return String(userGateStatus).toUpperCase() === status;
      }
      return true;
    });

    // Optional text search filter
    if (search) {
      filtered = filtered.filter((u: any) => {
        const name = (u.full_name || u.name || "").toLowerCase();
        const email = (u.email_id || u.email || "").toLowerCase();
        const phone = (u.phone_number || u.phone || "").toLowerCase();
        const college = (u.collage_name || u.college_name || u.college || "").toLowerCase();
        const anweshaId = (u.anwesha_id || "").toLowerCase();
        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          college.includes(search) ||
          anweshaId.includes(search)
        );
      });
    }

    const users = filtered.map((u: any) => ({
      user_id: u.user_id || u.id || "",
      name: u.full_name || u.name || "Unnamed",
      email: u.email_id || u.email || "—",
      phone: u.phone_number || u.phone || "—",
      college: u.collage_name || u.college_name || u.college || "—",
      anwesha_id: u.anwesha_id || "—",
      gate_status: status,
      entry_time: gate === "FEST_ARENA" ? u.festArena_entryTime : u.mainGate_entryTime,
      exit_time: gate === "FEST_ARENA" ? u.festArena_exitTime : u.mainGate_exitTime,
    }));

    return NextResponse.json({
      success: true,
      gate,
      status,
      total: users.length,
      users,
    });
  } catch (error: any) {
    console.error("Gate Users Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error fetching gate users" },
      { status: 500 }
    );
  }
}
