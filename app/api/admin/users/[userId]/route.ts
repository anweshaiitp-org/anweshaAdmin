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
      `${BACKEND_URL}/admin/users/${encodeURIComponent(decodedUserId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    let data = await res.json().catch(() => ({}));

    // If direct lookup returns 404 (e.g. if an Anwesha ID was passed instead of system user UUID),
    // search for the user by anwesha_id / query to resolve their system user_id
    if ((res.status === 404 || !data?.success) && decodedUserId) {
      try {
        const searchRes = await fetch(
          `${BACKEND_URL}/admin/users?search=${encodeURIComponent(decodedUserId)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const candidates = searchData?.data || searchData?.users || [];
          const candidate = candidates.find(
            (c: any) =>
              (c.anwesha_id && c.anwesha_id.toUpperCase() === decodedUserId.toUpperCase()) ||
              c.user_id === decodedUserId ||
              c.id === decodedUserId
          ) || candidates[0];

          const resolvedUserId = candidate?.user_id || candidate?.id;
          if (resolvedUserId && resolvedUserId !== decodedUserId) {
            const fallbackRes = await fetch(
              `${BACKEND_URL}/admin/users/${encodeURIComponent(resolvedUserId)}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                cache: 'no-store',
              }
            );
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (fallbackData?.success && fallbackData?.data?.profile) {
                const college =
                  fallbackData.data.profile.college_name ||
                  fallbackData.data.profile.collage_name ||
                  fallbackData.data.profile.college ||
                  '';
                fallbackData.data.profile.college_name = college;
                fallbackData.data.profile.collage_name = college;
              }
              return NextResponse.json(fallbackData, { status: fallbackRes.status });
            }
          }
        }
      } catch (searchErr) {
        console.error('Fallback search error:', searchErr);
      }
    }

    if (data?.success && data?.data?.profile) {
      const college =
        data.data.profile.college_name ||
        data.data.profile.collage_name ||
        data.data.profile.college ||
        '';
      data.data.profile.college_name = college;
      data.data.profile.collage_name = college;
    }

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error: any) {
    console.error('Fetch user full profile error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Server Error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  const { userId } = await params;
  let bodyJson: any = {};
  try {
    bodyJson = await req.json();
  } catch {
    bodyJson = {};
  }

  const college = bodyJson.college_name || bodyJson.collage_name;
  if (college) {
    bodyJson.college_name = college;
    bodyJson.collage_name = college;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(bodyJson)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(err, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  const { userId } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(err, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
