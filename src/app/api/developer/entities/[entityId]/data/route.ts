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

// GET - List all records for an entity
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

    // Fetch records from the entity's table
    const sql = await getDatabaseClient();

    try {
      const records = await sql.unsafe(
        `SELECT * FROM ${entity.tableName} ORDER BY created_at DESC`
      );

      await sql.end();

      return NextResponse.json({
        records: records || [],
        entity: entity,
      });
    } catch (error) {
      await sql.end();
      console.error('Error fetching records:', error);
      return NextResponse.json({
        records: [],
        entity: entity,
        error: 'Table might not exist yet',
      });
    }
  } catch (error) {
    console.error('Error fetching entity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity data' },
      { status: 500 }
    );
  }
}

// POST - Create new record
export async function POST(
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

    // Validate required fields
    for (const field of fields) {
      if (field.required && !body[field.name]) {
        return NextResponse.json(
          { error: `${field.name} is required` },
          { status: 400 }
        );
      }
    }

    // Build INSERT SQL
    const sql = await getDatabaseClient();

    try {
      const fieldNames = Object.keys(body).filter(key =>
        fields.some((f: any) => f.name === key)
      );
      const fieldValues = fieldNames.map(name => body[name]);

      if (fieldNames.length === 0) {
        await sql.end();
        return NextResponse.json(
          { error: 'No valid fields provided' },
          { status: 400 }
        );
      }

      // Create parameterized query
      const placeholders = fieldNames.map((_, index) => `$${index + 1}`).join(', ');
      const columns = fieldNames.join(', ');

      const insertQuery = `
        INSERT INTO ${entity.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const [newRecord] = await sql.unsafe(insertQuery, fieldValues);

      await sql.end();

      return NextResponse.json({
        record: newRecord,
        message: 'Record created successfully',
      });
    } catch (error) {
      await sql.end();
      console.error('Error creating record:', error);
      return NextResponse.json(
        { error: 'Failed to create record', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating record:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}