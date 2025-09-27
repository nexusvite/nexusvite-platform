import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { developerEntities } from '@/core/database/schemas';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth/config';
import postgres from 'postgres';

// Helper to get database client for raw SQL
async function getDatabaseClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return postgres(databaseUrl);
}

// GET - Get single entity details
export async function GET(
  request: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [entity] = await db
      .select()
      .from(developerEntities)
      .where(
        and(
          eq(developerEntities.id, params.entityId),
          eq(developerEntities.userId, session.user.id)
        )
      )
      .limit(1);

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Get record count
    const sql = await getDatabaseClient();
    let recordCount = 0;

    try {
      const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${entity.tableName}`);
      recordCount = parseInt(result[0]?.count || '0');
    } catch (error) {
      console.error(`Error getting count for ${entity.tableName}:`, error);
    }

    await sql.end();

    return NextResponse.json({
      entity: {
        ...entity,
        recordCount,
      },
    });
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity' },
      { status: 500 }
    );
  }
}

// DELETE - Delete entity and its table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get entity details first
    const [entity] = await db
      .select()
      .from(developerEntities)
      .where(
        and(
          eq(developerEntities.id, params.entityId),
          eq(developerEntities.userId, session.user.id)
        )
      )
      .limit(1);

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Drop the database table
    const sql = await getDatabaseClient();

    try {
      // Drop trigger first
      await sql.unsafe(`DROP TRIGGER IF EXISTS update_${entity.tableName}_updated_at ON ${entity.tableName}`);

      // Drop table
      await sql.unsafe(`DROP TABLE IF EXISTS ${entity.tableName}`);
    } catch (error) {
      console.error('Error dropping table:', error);
    } finally {
      await sql.end();
    }

    // Delete entity record
    await db
      .delete(developerEntities)
      .where(eq(developerEntities.id, params.entityId));

    return NextResponse.json({
      message: 'Entity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    );
  }
}

// PATCH - Update entity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Get existing entity
    const [entity] = await db
      .select()
      .from(developerEntities)
      .where(
        and(
          eq(developerEntities.id, params.entityId),
          eq(developerEntities.userId, session.user.id)
        )
      )
      .limit(1);

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Update entity record
    const [updatedEntity] = await db
      .update(developerEntities)
      .set({
        name: name || entity.name,
        description: description || entity.description,
        updatedAt: new Date(),
      })
      .where(eq(developerEntities.id, params.entityId))
      .returning();

    return NextResponse.json({
      entity: updatedEntity,
      message: 'Entity updated successfully',
    });
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    );
  }
}