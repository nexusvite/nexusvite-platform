import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { apiKeys } from '@/core/database/schemas/api-keys';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/core/auth/config';
import { randomBytes } from 'crypto';

// Generate a secure API key
function generateApiKey(prefix: string = 'nxv'): string {
  const key = randomBytes(32).toString('base64url');
  return `${prefix}_${key}`;
}

// Hash API key for storage (in production, use proper hashing)
function hashApiKey(key: string): string {
  // In production, use bcrypt or argon2
  return Buffer.from(key).toString('base64');
}

// GET - List all API keys for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        description: apiKeys.description,
        prefix: apiKeys.prefix,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        scopes: apiKeys.scopes,
        active: apiKeys.active,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, expiresIn, scopes } = data;

    // Generate API key
    const prefix = 'nxv';
    const apiKey = generateApiKey(prefix);
    const hashedKey = hashApiKey(apiKey);

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn && expiresIn !== 'never') {
      const now = new Date();
      switch (expiresIn) {
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Create the API key
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        name,
        description,
        key: apiKey,
        hashedKey,
        prefix,
        expiresAt,
        scopes: scopes || [],
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json({
      id: newKey.id,
      name: newKey.name,
      key: apiKey, // Return the full key only once
      prefix: newKey.prefix,
      createdAt: newKey.createdAt,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}