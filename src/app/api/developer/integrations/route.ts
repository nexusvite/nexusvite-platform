import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { integrations } from '@/core/database/schemas/integrations';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// GET - List all integrations for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIntegrations = await db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, session.user.id))
      .orderBy(desc(integrations.createdAt));

    return NextResponse.json({ integrations: userIntegrations });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, provider, category, config, credentials } = data;

    // Create the integration
    const [newIntegration] = await db
      .insert(integrations)
      .values({
        name,
        provider,
        category,
        status: 'connected',
        config: config || {},
        credentials: credentials || {}, // In production, encrypt sensitive data
        userId: session.user.id,
        lastSyncAt: new Date(),
      })
      .returning();

    return NextResponse.json({ integration: newIntegration });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}