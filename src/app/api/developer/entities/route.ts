import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { developerEntities } from '@/core/database/schemas';
import { eq, desc } from 'drizzle-orm';
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

// GET - List all entities
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entities = await db
      .select()
      .from(developerEntities)
      .where(eq(developerEntities.userId, session.user.id))
      .orderBy(desc(developerEntities.createdAt));

    // Get record counts for each entity
    const sql = await getDatabaseClient();
    const entitiesWithCounts = await Promise.all(
      entities.map(async (entity) => {
        try {
          // Check if table exists and get count
          const result = await sql`
            SELECT COUNT(*) as count
            FROM information_schema.tables
            WHERE table_name = ${entity.tableName}
          `;

          let recordCount = 0;
          if (result[0]?.count > 0) {
            const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${entity.tableName}`);
            recordCount = parseInt(countResult[0]?.count || '0');
          }

          return {
            ...entity,
            recordCount,
          };
        } catch (error) {
          console.error(`Error getting count for ${entity.tableName}:`, error);
          return {
            ...entity,
            recordCount: 0,
          };
        }
      })
    );

    await sql.end();

    return NextResponse.json({
      entities: entitiesWithCounts,
    });
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}

// POST - Create new entity
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, tableName, description, fields } = body;

    // Validate input
    if (!name || !tableName || !fields || fields.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate table name
    if (!/^[a-z_][a-z0-9_]*$/.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name. Use lowercase letters, numbers, and underscores only.' },
        { status: 400 }
      );
    }

    // Check if table already exists
    const existingEntity = await db
      .select()
      .from(developerEntities)
      .where(eq(developerEntities.tableName, tableName))
      .limit(1);

    if (existingEntity.length > 0) {
      return NextResponse.json(
        { error: 'Table name already exists' },
        { status: 409 }
      );
    }

    // Create entity record
    const [newEntity] = await db
      .insert(developerEntities)
      .values({
        name,
        tableName,
        description,
        fields: JSON.stringify(fields),
        userId: session.user.id,
      })
      .returning();

    // Create actual database table
    const sql = await getDatabaseClient();

    try {
      // Build CREATE TABLE SQL
      const fieldDefinitions = fields.map((field: any) => {
        let sqlType = 'TEXT';
        switch (field.type) {
          case 'number':
            sqlType = 'NUMERIC';
            break;
          case 'boolean':
            sqlType = 'BOOLEAN';
            break;
          case 'date':
            sqlType = 'TIMESTAMP';
            break;
          case 'json':
            sqlType = 'JSONB';
            break;
        }

        let definition = `${field.name} ${sqlType}`;
        if (field.required) {
          definition += ' NOT NULL';
        }
        if (field.unique) {
          definition += ' UNIQUE';
        }
        if (field.defaultValue) {
          if (field.type === 'boolean') {
            definition += ` DEFAULT ${field.defaultValue}`;
          } else if (field.type === 'number') {
            definition += ` DEFAULT ${field.defaultValue}`;
          } else {
            definition += ` DEFAULT '${field.defaultValue}'`;
          }
        }
        return definition;
      }).join(',\n  ');

      const createTableSQL = `
        CREATE TABLE ${tableName} (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          ${fieldDefinitions},
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql.unsafe(createTableSQL);

      // Create trigger for updated_at
      await sql.unsafe(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_${tableName}_updated_at
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      await sql.end();

      return NextResponse.json({
        entity: newEntity,
        message: 'Entity created successfully',
      });
    } catch (error) {
      // Rollback - delete entity record if table creation failed
      await db
        .delete(developerEntities)
        .where(eq(developerEntities.id, newEntity.id));

      await sql.end();

      console.error('Error creating table:', error);
      return NextResponse.json(
        { error: 'Failed to create database table' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}