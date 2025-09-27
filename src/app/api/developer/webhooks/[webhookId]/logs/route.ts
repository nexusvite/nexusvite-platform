import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { webhooks, webhookLogs } from '@/core/database/schemas';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// GET - Get webhook logs
export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if webhook exists and belongs to user
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, params.webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get logs for this webhook
    const logs = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, params.webhookId))
      .orderBy(desc(webhookLogs.createdAt))
      .limit(100); // Limit to last 100 logs

    return NextResponse.json({
      logs,
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    );
  }
}

// DELETE - Clear webhook logs
export async function DELETE(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if webhook exists and belongs to user
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, params.webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Delete all logs for this webhook
    await db
      .delete(webhookLogs)
      .where(eq(webhookLogs.webhookId, params.webhookId));

    return NextResponse.json({
      message: 'Webhook logs cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing webhook logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear webhook logs' },
      { status: 500 }
    );
  }
}