import { NextRequest, NextResponse } from 'next/server';

const TARGET_BACKEND = 'http://localhost:4566/restapis/ceajcrzdhb/prod/_user_request_';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathString = path.join('/');
  
  const targetUrl = `${TARGET_BACKEND}/${pathString}`;
  console.log(`[PROXY] Forwarding request to: ${targetUrl}`);

  const method = request.method;
  const headers = new Headers();
  
  // Copy allowed headers
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
      headers.set(key, value);
    }
  });

  let body: any = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = await request.text();
    } catch (e) {
      // No body or error reading body
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store'
    });

    const data = await response.text();
    
    // Copy response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-encoding') {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error(`[PROXY ERROR] Failed to fetch from backend:`, error);
    return NextResponse.json(
      { success: false, message: `Proxy error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: any) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: any) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: any) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: any) {
  return handleProxy(request, context);
}
