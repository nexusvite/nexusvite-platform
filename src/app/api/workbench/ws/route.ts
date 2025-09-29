import { NextRequest } from 'next/server';
import { auth } from '@/core/auth';

// WebSocket handler for real-time execution updates
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 });
  }

  // Note: In production Next.js, you'll need to use a separate WebSocket server
  // This is a placeholder that shows the expected API structure
  // For development, we can use a separate WebSocket server running alongside Next.js

  return new Response('WebSocket endpoint - requires separate WebSocket server', {
    status: 501,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Alternative: Use Server-Sent Events (SSE) for real-time updates
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { type, topic } = body;

  if (type === 'subscribe' && topic === 'executions') {
    // Return SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
        );

        // Set up interval for heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`)
            );
          } catch (error) {
            clearInterval(heartbeat);
          }
        }, 30000);

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  return new Response('Invalid request', { status: 400 });
}