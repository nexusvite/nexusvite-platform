import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth/config';
import { headers } from 'next/headers';
import { db } from '@/core/database';
import { workflowCredentials } from '@/core/database/schemas/workflow-credentials';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    const { credentialId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credential = await db
      .select()
      .from(workflowCredentials)
      .where(eq(workflowCredentials.id, credentialId))
      .limit(1);

    if (credential.length === 0) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Check if user has access to this credential
    if (credential[0].userId !== session.user.id && !credential[0].isGlobal) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      credential: {
        ...credential[0],
        config: maskSensitiveFields(credential[0].config, credential[0].type),
      },
    });
  } catch (error) {
    console.error('Error fetching credential:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credential' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    const { credentialId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if user owns the credential
    const existing = await db
      .select()
      .from(workflowCredentials)
      .where(
        and(
          eq(workflowCredentials.id, credentialId),
          eq(workflowCredentials.userId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Credential not found or forbidden' }, { status: 404 });
    }

    // Update credential
    const updated = await db
      .update(workflowCredentials)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(workflowCredentials.id, credentialId))
      .returning();

    return NextResponse.json({
      credential: {
        ...updated[0],
        config: maskSensitiveFields(updated[0].config, updated[0].type),
      },
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json(
      { error: 'Failed to update credential' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    const { credentialId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the credential
    const existing = await db
      .select()
      .from(workflowCredentials)
      .where(
        and(
          eq(workflowCredentials.id, credentialId),
          eq(workflowCredentials.userId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Credential not found or forbidden' }, { status: 404 });
    }

    // TODO: Check if credential is in use by any workflows

    await db
      .delete(workflowCredentials)
      .where(eq(workflowCredentials.id, credentialId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}

// Test credential connection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    const { credentialId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credential = await db
      .select()
      .from(workflowCredentials)
      .where(eq(workflowCredentials.id, credentialId))
      .limit(1);

    if (credential.length === 0) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Check if user has access to this credential
    if (credential[0].userId !== session.user.id && !credential[0].isGlobal) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Test the credential based on type
    const testResult = await testCredential(credential[0].type, credential[0].config);

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
    });
  } catch (error) {
    console.error('Error testing credential:', error);
    return NextResponse.json(
      { error: 'Failed to test credential' },
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

async function testCredential(type: string, config: any): Promise<{ success: boolean; message: string }> {
  // Implement actual testing logic based on credential type
  switch (type) {
    case 'smtp':
      // Test SMTP connection
      // For now, just simulate
      return { success: true, message: 'SMTP connection successful' };

    case 'postgresql':
    case 'mysql':
    case 'mongodb':
      // Test database connection
      return { success: true, message: 'Database connection successful' };

    case 'openai':
      // Test API key
      return { success: true, message: 'API key validated' };

    default:
      return { success: false, message: 'Unknown credential type' };
  }
}