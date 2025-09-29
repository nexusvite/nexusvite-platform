import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/database';
import { workflowExecutions } from '@/core/database/schemas';
import { eq, and } from 'drizzle-orm';
import { KafkaService } from '@/core/queue/kafka-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const executionId = params.id;

    // Verify execution ownership
    const [execution] = await db
      .select()
      .from(workflowExecutions)
      .where(
        and(
          eq(workflowExecutions.id, executionId),
          eq(workflowExecutions.userId, session.user.id)
        )
      )
      .limit(1);

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    if (execution.status !== 'running') {
      return NextResponse.json(
        { error: 'Cannot pause execution that is not running' },
        { status: 400 }
      );
    }

    // Send pause message to Kafka
    const kafkaService = new KafkaService();
    await kafkaService.connect();

    await kafkaService.sendWorkflowMessage({
      type: 'PAUSE_WORKFLOW',
      workflowId: execution.workflowId,
      executionId,
      priority: 'high',
      payload: {},
    });

    // Update execution status
    await db
      .update(workflowExecutions)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));

    await kafkaService.disconnect();

    return NextResponse.json({ success: true, status: 'paused' });
  } catch (error) {
    console.error('Failed to pause execution:', error);
    return NextResponse.json(
      { error: 'Failed to pause execution' },
      { status: 500 }
    );
  }
}