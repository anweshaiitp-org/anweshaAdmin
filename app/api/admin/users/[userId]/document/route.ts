import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'BACKEND_URL is not configured',
        },
        { status: 500 }
      );
    }

    const { userId } = await params;
    const decodedUserId = decodeURIComponent(userId);

    const res = await fetch(
      `${BACKEND_URL}/admin/users/${encodeURIComponent(decodedUserId)}/document${req.nextUrl.search}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error: any) {
    console.error('Fetch user document URL error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Server Error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'BACKEND_URL is not configured',
        },
        { status: 500 }
      );
    }

    const { userId } = await params;
    const decodedUserId = decodeURIComponent(userId);
    const body = await req.json().catch(() => ({}));

    // Forward to backend /admin/users/{userId}/document
    const targetUrl = `${BACKEND_URL}/admin/users/${encodeURIComponent(decodedUserId)}/document`;
    let res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // If backend returns 404/405 (e.g. if the API Gateway has not yet registered POST /document),
    // fall back to updating user directly via PUT /admin/users/{userId}
    if ((res.status === 404 || res.status === 405) && body.college_id_file_key) {
      const cleanAadhar = String(body.aadhar_id_number || '').replace(/[\s-]/g, '').trim();
      res = await fetch(`${BACKEND_URL}/admin/users/${encodeURIComponent(decodedUserId)}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          college_id_card: body.college_id_file_key,
          college_id_number: String(body.college_id_number || '').trim(),
          aadhar_card: body.aadhar_id_file_key,
          aadhar_id_number: cleanAadhar,
          identity_card: body.college_id_file_key,
          id_card_number: String(body.college_id_number || '').trim(),
          id_card_type: 'COLLEGE_ID',
          id_card_status: 'VERIFIED',
        }),
      });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error: any) {
    console.error('Manual document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Server Error',
      },
      { status: 500 }
    );
  }
}
