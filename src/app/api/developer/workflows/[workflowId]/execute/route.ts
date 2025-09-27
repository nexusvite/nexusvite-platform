import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { workflows, workflowExecutions, workflowNodes, workflowConnections } from '@/core/database/schemas/workflows';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// POST - Execute a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, params.workflowId),
          eq(workflows.userId, session.user.id)
        )
      );

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if workflow is active
    if (!workflow.active) {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      );
    }

    // Get trigger data from request body if provided
    const triggerData = await request.json().catch(() => ({}));

    // Create execution record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId: params.workflowId,
        status: 'pending',
        triggerData,
        startedAt: new Date(),
      })
      .returning();

    // Start async execution (in a real implementation, this would be handled by a queue)
    executeWorkflowAsync(params.workflowId, execution.id, workflow, session.user.id);

    return NextResponse.json({
      executionId: execution.id,
      status: 'started',
      message: 'Workflow execution started',
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}

// Async workflow execution (simplified)
async function executeWorkflowAsync(
  workflowId: string,
  executionId: string,
  workflow: any,
  userId: string
) {
  const startTime = Date.now();
  const logs: any[] = [];
  const nodeResults: Record<string, any> = {};

  try {
    // Update status to running
    await db
      .update(workflowExecutions)
      .set({ status: 'running' })
      .where(eq(workflowExecutions.id, executionId));

    // Fetch nodes and connections
    const nodes = await db
      .select()
      .from(workflowNodes)
      .where(eq(workflowNodes.workflowId, workflowId));

    const connections = await db
      .select()
      .from(workflowConnections)
      .where(eq(workflowConnections.workflowId, workflowId));

    // Build execution graph
    const nodeMap = new Map(nodes.map(n => [n.nodeId, n]));
    const graph = buildExecutionGraph(nodes, connections);

    // Execute nodes in topological order
    const executionOrder = topologicalSort(graph);

    for (const nodeId of executionOrder) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const startNodeTime = Date.now();
      logs.push({
        timestamp: new Date().toISOString(),
        nodeId,
        message: `Executing node: ${node.label}`,
        type: 'info',
      });

      try {
        // Execute node based on type
        const result = await executeNode(node, nodeResults, userId);
        nodeResults[nodeId] = result;

        logs.push({
          timestamp: new Date().toISOString(),
          nodeId,
          message: `Node completed successfully`,
          type: 'success',
          duration: Date.now() - startNodeTime,
        });
      } catch (nodeError: any) {
        logs.push({
          timestamp: new Date().toISOString(),
          nodeId,
          message: `Node failed: ${nodeError.message}`,
          type: 'error',
          duration: Date.now() - startNodeTime,
        });
        throw nodeError;
      }
    }

    // Update execution as completed
    await db
      .update(workflowExecutions)
      .set({
        status: 'success',
        completedAt: new Date(),
        duration: Date.now() - startTime,
        logs,
        nodeExecutions: nodeResults,
      })
      .where(eq(workflowExecutions.id, executionId));

  } catch (error: any) {
    // Update execution as failed
    await db
      .update(workflowExecutions)
      .set({
        status: 'failed',
        completedAt: new Date(),
        duration: Date.now() - startTime,
        error: error.message,
        logs,
        nodeExecutions: nodeResults,
      })
      .where(eq(workflowExecutions.id, executionId));
  }
}

// Build execution graph from nodes and connections
function buildExecutionGraph(nodes: any[], connections: any[]) {
  const graph: Record<string, string[]> = {};

  // Initialize all nodes
  nodes.forEach(node => {
    graph[node.nodeId] = [];
  });

  // Add dependencies
  connections.forEach(conn => {
    if (graph[conn.targetNodeId]) {
      graph[conn.targetNodeId].push(conn.sourceNodeId);
    }
  });

  return graph;
}

// Topological sort for execution order
function topologicalSort(graph: Record<string, string[]>): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Visit dependencies first
    if (graph[nodeId]) {
      graph[nodeId].forEach(dep => visit(dep));
    }

    result.push(nodeId);
  }

  Object.keys(graph).forEach(nodeId => visit(nodeId));
  return result;
}

// Execute a single node (simplified)
async function executeNode(node: any, previousResults: Record<string, any>, userId: string) {
  const { type, subType, config } = node;

  // Simple mock execution based on node type
  switch (type) {
    case 'trigger':
      return { triggered: true, timestamp: new Date().toISOString() };

    case 'action':
      switch (subType) {
        case 'http':
          // Mock HTTP request
          return {
            success: true,
            response: { status: 200, data: 'Mock response' },
          };
        case 'database':
          // Mock database query
          return {
            success: true,
            rows: [],
          };
        case 'email':
          // Mock email send
          return {
            success: true,
            messageId: `msg_${Date.now()}`,
          };
        default:
          return { success: true };
      }

    case 'logic':
      switch (subType) {
        case 'condition':
          // Mock condition evaluation
          return {
            result: true,
            branch: 'true',
          };
        case 'delay':
          // Mock delay
          const duration = config.duration || 1000;
          await new Promise(resolve => setTimeout(resolve, Math.min(duration, 5000)));
          return { delayed: true, duration };
        default:
          return { success: true };
      }

    case 'transform':
      switch (subType) {
        case 'code':
          // Mock code execution (in production, this would be sandboxed)
          return {
            success: true,
            output: 'Code executed',
          };
        default:
          return { success: true };
      }

    default:
      return { success: true };
  }
}