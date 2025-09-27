import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { apiKeys } from '@/core/database/schemas/api-keys';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// PATCH - Update an API key (toggle active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { keyId: string } }
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

    const [updatedKey] = await db
      .update(apiKeys)
      .set({ active, updatedAt: new Date() })
      .where(
        and(
          eq(apiKeys.id, params.keyId),
          eq(apiKeys.userId, session.user.id)
        )
      )
      .returning();

    if (!updatedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ key: updatedKey });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [deletedKey] = await db
      .delete(apiKeys)
      .where(
        and(
          eq(apiKeys.id, params.keyId),
          eq(apiKeys.userId, session.user.id)
        )
      )
      .returning();

    if (!deletedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}