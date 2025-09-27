import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { integrations } from '@/core/database/schemas/integrations';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// PATCH - Update an integration (toggle active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { active } = data;

    const [updatedIntegration] = await db
      .update(integrations)
      .set({ active, updatedAt: new Date() })
      .where(
        and(
          eq(integrations.id, params.integrationId),
          eq(integrations.userId, session.user.id)
        )
      )
      .returning();

    if (!updatedIntegration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ integration: updatedIntegration });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect/delete an integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [deletedIntegration] = await db
      .delete(integrations)
      .where(
        and(
          eq(integrations.id, params.integrationId),
          eq(integrations.userId, session.user.id)
        )
      )
      .returning();

    if (!deletedIntegration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}