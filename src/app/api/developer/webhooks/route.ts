import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { webhooks } from '@/core/database/schemas';
import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// GET - List webhooks
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, session.user.id));

    return NextResponse.json({
      webhooks: userWebhooks,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// POST - Create webhook
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, url, secret, events, headers, active } = body;

    // Validate required fields
    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'Name, URL, and at least one event are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create webhook
    const [webhook] = await db
      .insert(webhooks)
      .values({
        name,
        description,
        url,
        secret,
        events,
        headers: headers || {},
        active: active !== undefined ? active : true,
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json({
      webhook,
      message: 'Webhook created successfully',
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}