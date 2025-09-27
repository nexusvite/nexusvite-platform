import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { webhooks, webhookLogs } from '@/core/database/schemas';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// GET - Get single webhook
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

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

// PATCH - Update webhook
export async function PATCH(
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

    const body = await request.json();

    // Check if webhook exists and belongs to user
    const [existingWebhook] = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, params.webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.secret !== undefined) updateData.secret = body.secret;
    if (body.events !== undefined) updateData.events = body.events;
    if (body.headers !== undefined) updateData.headers = body.headers;
    if (body.active !== undefined) updateData.active = body.active;

    // Update webhook
    const [updatedWebhook] = await db
      .update(webhooks)
      .set(updateData)
      .where(eq(webhooks.id, params.webhookId))
      .returning();

    return NextResponse.json({
      webhook: updatedWebhook,
      message: 'Webhook updated successfully',
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE - Delete webhook
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
    const [existingWebhook] = await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.id, params.webhookId),
          eq(webhooks.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Delete webhook (logs will be cascade deleted)
    await db.delete(webhooks).where(eq(webhooks.id, params.webhookId));

    return NextResponse.json({
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}