import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth/config';
import { headers } from 'next/headers';
import { db } from '@/core/database';
import { workflowCredentials } from '@/core/database/schemas/workflow-credentials';
import { eq, and, or } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch credentials for the user (including global ones)
    const credentials = await db
      .select()
      .from(workflowCredentials)
      .where(
        or(
          eq(workflowCredentials.userId, session.user.id),
          eq(workflowCredentials.isGlobal, true)
        )
      );

    // Mask sensitive data
    const maskedCredentials = credentials.map(cred => ({
      ...cred,
      config: maskSensitiveFields(cred.config, cred.type),
    }));

    return NextResponse.json({
      credentials: maskedCredentials,
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, description, config, isGlobal } = body;

    // Validate required fields
    if (!name || !type || !config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new credential
    const credential = await db.insert(workflowCredentials).values({
      id: createId(),
      name,
      type,
      description,
      config: encryptConfig(config), // In production, encrypt sensitive data
      isGlobal: isGlobal || false,
      userId: session.user.id,
    }).returning();

    return NextResponse.json({
      credential: {
        ...credential[0],
        config: maskSensitiveFields(credential[0].config, credential[0].type),
      },
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json(
      { error: 'Failed to create credential' },
      { status: 500 }
    );
  }
}

// Helper functions
function maskSensitiveFields(config: any, type: string): any {
  const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'key'];
  const masked = { ...config };

  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = masked[key] ? '********' : '';
    }
  });

  return masked;
}

function encryptConfig(config: any): any {
  // In production, implement proper encryption
  // For now, just return the config
  return config;
}

function decryptConfig(config: any): any {
  // In production, implement proper decryption
  // For now, just return the config
  return config;
}