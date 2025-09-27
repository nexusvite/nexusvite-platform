import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { webhooks, webhookLogs } from '@/core/database/schemas';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth/config';
import crypto from 'crypto';

// Function to sign webhook payload
function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

// POST - Test webhook
export async function POST(
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

    // Get webhook
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

    // Prepare test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    const payloadString = JSON.stringify(testPayload);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': 'webhook.test',
      'X-Webhook-Id': webhook.id,
      'X-Webhook-Timestamp': new Date().toISOString(),
      ...(webhook.headers || {}),
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      const signature = signPayload(payloadString, webhook.secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    // Create log entry
    const [log] = await db
      .insert(webhookLogs)
      .values({
        webhookId: webhook.id,
        event: 'webhook.test',
        status: 'pending',
        request: testPayload,
      })
      .returning();

    // Send webhook
    const startTime = Date.now();
    let responseStatus = 'failed';
    let statusCode: string | undefined;
    let responseData: any;
    let errorMessage: string | undefined;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      statusCode = response.status.toString();
      responseStatus = response.ok ? 'success' : 'failed';

      try {
        responseData = await response.text();
        // Try to parse as JSON if possible
        try {
          responseData = JSON.parse(responseData);
        } catch {
          // Keep as text if not JSON
        }
      } catch {
        responseData = 'Unable to read response body';
      }
    } catch (error: any) {
      responseStatus = 'failed';
      errorMessage = error.message || 'Request failed';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (10s)';
      }
    }

    const duration = Date.now() - startTime;

    // Update log entry
    await db
      .update(webhookLogs)
      .set({
        status: responseStatus,
        statusCode,
        response: responseData,
        error: errorMessage,
        duration: duration.toString(),
      })
      .where(eq(webhookLogs.id, log.id));

    return NextResponse.json({
      status: responseStatus,
      statusCode,
      duration,
      logId: log.id,
      message: `Test webhook sent. Status: ${responseStatus}`,
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}