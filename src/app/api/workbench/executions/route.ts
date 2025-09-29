import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import { db } from '@/core/database';
import { workflowExecutions } from '@/core/database/schemas/workflow-execution';
import { workflows } from '@/core/database/schemas/workflows';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const workflowId = searchParams.get('workflowId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    const conditions = [eq(workflowExecutions.userId, session.user.id)];

    if (status && status !== 'all') {
      conditions.push(eq(workflowExecutions.status, status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'));
    }

    if (workflowId) {
      conditions.push(eq(workflowExecutions.workflowId, workflowId));
    }

    // Fetch executions with workflow data
    let executionsQuery = [];
    try {
      executionsQuery = await db
        .select({
          execution: workflowExecutions,
          workflow: workflows,
        })
        .from(workflowExecutions)
        .leftJoin(
          workflows,
          eq(workflows.id, workflowExecutions.workflowId)
        )
        .where(and(...conditions))
        .orderBy(desc(workflowExecutions.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (dbError) {
      console.warn('Database query failed, returning empty results:', dbError);
      // Return empty results if table doesn't exist yet
      return NextResponse.json({
        executions: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Format executions for the workbench UI
    const executions = executionsQuery.map(row => {
      const metadata = (row.execution.metadata || {}) as any;
      let outputs = (row.execution.outputs || {}) as any;

      // Handle case where outputs are wrapped under "nodes" key
      if (outputs.nodes && typeof outputs.nodes === 'object' && Object.keys(outputs).length === 1) {
        outputs = outputs.nodes;
      }

      const logs = metadata.logs || [];

      // Calculate progress based on node execution status
      const nodeStatuses = Object.values(outputs);
      const totalNodes = nodeStatuses.length;
      const completedNodes = nodeStatuses.filter((n: any) => n.status === 'success').length;
      const progress = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

      return {
        executionId: row.execution.id,
        workflowId: row.execution.workflowId,
        workflowName: row.workflow?.name || 'Unnamed Workflow',
        status: row.execution.status,
        startTime: row.execution.startTime,
        endTime: row.execution.endTime,
        progress,
        duration: metadata.duration,
        triggeredBy: metadata.triggeredBy || 'manual',
        error: row.execution.error,
        logs: logs.slice(-10), // Return last 10 log entries
        nodes: Object.entries(outputs).map(([nodeId, nodeData]: [string, any]) => {
          // Better name formatting
          const name = nodeId
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Better type inference
          let type = 'action';
          if (nodeId.includes('trigger') || nodeId === 'start') {
            type = 'trigger';
          } else if (nodeId.includes('end') || nodeId === 'end') {
            type = 'end';
          }

          return {
            id: nodeId,
            name: name,
            type: type,
            status: nodeData.status === 'success' ? 'completed' :
                   nodeData.status === 'error' ? 'failed' :
                   nodeData.status === 'running' ? 'running' : 'pending',
            executionTime: nodeData.executionTime,
            inputs: nodeData.inputs || {},
            outputs: nodeData.result || nodeData.outputs || {},
            error: nodeData.error,
          };
        }),
        metrics: {
          totalExecutionTime: metadata.duration || 0,
          nodesCompleted: completedNodes,
          nodesTotal: totalNodes,
          successRate: totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0,
        },
      };
    });

    // Get total count for pagination
    const countResult = await db
      .select({ count: workflowExecutions.id })
      .from(workflowExecutions)
      .where(and(...conditions));

    const total = countResult.length;

    return NextResponse.json({
      executions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}

// Helper function to calculate progress
function calculateProgress(execution: unknown): number {
  if (execution.status === 'completed') return 100;
  if (execution.status === 'failed') return 100;
  if (execution.status === 'cancelled') return 100;
  if (execution.status === 'pending') return 0;

  // For running executions, estimate based on time or node completion
  const outputs = (execution as { outputs?: unknown }).outputs;

  if (outputs && typeof outputs === 'object') {
    const totalNodes = Object.keys(outputs).length;
    const completedNodes = Object.values(outputs).filter(
      (n: unknown) => (n as { status?: string }).status === 'success' || (n as { status?: string }).status === 'error'
    ).length;

    if (totalNodes > 0) {
      return Math.round((completedNodes / totalNodes) * 100);
    }
  }

  return 50; // Default for running status
}