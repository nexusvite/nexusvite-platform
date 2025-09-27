import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { integrationProviders } from '@/core/database/schemas/integrations';
import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// GET - List all available integration providers
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await db
      .select()
      .from(integrationProviders)
      .where(eq(integrationProviders.available, true));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching integration providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration providers' },
      { status: 500 }
    );
  }
}