import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/database';
import { workflows, workflowExecutions } from '@/core/database/schemas';
import { eq } from 'drizzle-orm';
import { KafkaService } from '@/core/queue/kafka-service';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, inputs = {}, priority = 'normal' } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Fetch workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create execution record
    const executionId = createId();
    const now = new Date();

    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        id: executionId,
        workflowId,
        userId: session.user.id,
        status: 'pending',
        inputs,
        outputs: {},
        metadata: {
          priority,
          workflowName: workflow.name,
          trigger: 'manual',
        },
        startTime: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Send workflow to Kafka queue
    const kafkaService = new KafkaService();
    await kafkaService.connect();

    await kafkaService.sendWorkflowMessage({
      type: 'START_WORKFLOW',
      workflowId,
      executionId,
      priority: priority as 'low' | 'normal' | 'high' | 'critical',
      payload: {
        workflow: workflow.canvasState,
        inputs,
      },
    });

    await kafkaService.disconnect();

    // Return execution details
    return NextResponse.json({
      success: true,
      execution: {
        executionId: execution.id,
        workflowId: execution.workflowId,
        workflowName: workflow.name,
        status: execution.status,
        startTime: execution.startTime,
        inputs: execution.inputs,
      },
    });
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}