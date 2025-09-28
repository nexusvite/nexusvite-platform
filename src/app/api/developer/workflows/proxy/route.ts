import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth/config';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, method = 'GET', headers = {}, body: requestBody } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        // Remove headers that might cause issues
        'host': undefined,
        'origin': undefined,
        'referer': undefined,
      },
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      fetchOptions.body = typeof requestBody === 'string'
        ? requestBody
        : JSON.stringify(requestBody);

      // Set content-type if not already set
      if (!fetchOptions.headers['content-type'] && !fetchOptions.headers['Content-Type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
    }

    console.log(`Proxying ${method} request to ${url}`);

    // Make the actual request
    const response = await fetch(url, fetchOptions);

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text')) {
      data = await response.text();
    } else {
      // For binary data, convert to base64
      const buffer = await response.arrayBuffer();
      data = {
        type: 'binary',
        contentType,
        size: buffer.byteLength,
        base64: Buffer.from(buffer).toString('base64')
      };
    }

    // Return the proxied response
    return NextResponse.json({
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      success: response.ok,
    });

  } catch (error: any) {
    console.error('Proxy request failed:', error);
    return NextResponse.json({
      error: error.message || 'Proxy request failed',
      success: false,
    }, { status: 500 });
  }
}