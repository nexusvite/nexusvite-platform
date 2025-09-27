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

// GET - Get single record
export async function GET(
  request: NextRequest,
  { params }: { params: { entityId: string; recordId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get entity details
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

    // Fetch the specific record
    const sql = await getDatabaseClient();

    try {
      const [record] = await sql.unsafe(
        `SELECT * FROM ${entity.tableName} WHERE id = $1`,
        [params.recordId]
      );

      await sql.end();

      if (!record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json({
        record,
        entity,
      });
    } catch (error) {
      await sql.end();
      console.error('Error fetching record:', error);
      return NextResponse.json(
        { error: 'Failed to fetch record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    );
  }
}

// PATCH - Update record
export async function PATCH(
  request: NextRequest,
  { params }: { params: { entityId: string; recordId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get entity details
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

    const body = await request.json();

    // Parse fields from entity
    const fields = typeof entity.fields === 'string'
      ? JSON.parse(entity.fields)
      : entity.fields;

    // Filter out invalid fields and system fields
    const validFields = Object.keys(body).filter(key =>
      fields.some((f: any) => f.name === key) &&
      !['id', 'created_at', 'updated_at'].includes(key)
    );

    if (validFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Build UPDATE SQL
    const sql = await getDatabaseClient();

    try {
      const setClause = validFields.map((field, index) =>
        `${field} = $${index + 2}`
      ).join(', ');

      const values = [params.recordId, ...validFields.map(field => body[field])];

      const updateQuery = `
        UPDATE ${entity.tableName}
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const [updatedRecord] = await sql.unsafe(updateQuery, values);

      await sql.end();

      if (!updatedRecord) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json({
        record: updatedRecord,
        message: 'Record updated successfully',
      });
    } catch (error) {
      await sql.end();
      console.error('Error updating record:', error);
      return NextResponse.json(
        { error: 'Failed to update record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { entityId: string; recordId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get entity details
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

    // Delete the record
    const sql = await getDatabaseClient();

    try {
      const result = await sql.unsafe(
        `DELETE FROM ${entity.tableName} WHERE id = $1 RETURNING id`,
        [params.recordId]
      );

      await sql.end();

      if (result.length === 0) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Record deleted successfully',
      });
    } catch (error) {
      await sql.end();
      console.error('Error deleting record:', error);
      return NextResponse.json(
        { error: 'Failed to delete record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}