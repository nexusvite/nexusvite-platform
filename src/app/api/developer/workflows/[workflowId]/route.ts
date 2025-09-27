import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { workflows, workflowNodes, workflowConnections } from '@/core/database/schemas/workflows';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// GET - Get a single workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [workflow] = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, session.user.id)
        )
      );

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

// PATCH - Update a workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const updateData: any = { updatedAt: new Date() };

    // Update fields if provided
    if ('name' in data) updateData.name = data.name;
    if ('description' in data) updateData.description = data.description;
    if ('active' in data) updateData.active = data.active;
    if ('canvasState' in data) updateData.canvasState = data.canvasState;
    if ('triggerType' in data) updateData.triggerType = data.triggerType;
    if ('schedule' in data) updateData.schedule = data.schedule;
    if ('webhookPath' in data) updateData.webhookPath = data.webhookPath;
    if ('settings' in data) updateData.settings = data.settings;

    const [updatedWorkflow] = await db
      .update(workflows)
      .set(updateData)
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, session.user.id)
        )
      )
      .returning();

    if (!updatedWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // If canvas state was updated, sync nodes and connections
    if (data.canvasState) {
      // Delete existing nodes and connections
      await db
        .delete(workflowNodes)
        .where(eq(workflowNodes.workflowId, workflowId));

      await db
        .delete(workflowConnections)
        .where(eq(workflowConnections.workflowId, workflowId));

      // Insert new nodes if they exist
      if (data.canvasState.nodes && data.canvasState.nodes.length > 0) {
        const nodesToInsert = data.canvasState.nodes.map((node: any) => ({
          workflowId: workflowId,
          nodeId: node.id,
          type: node.type,
          subType: node.data?.subType || node.type,
          label: node.data?.label || 'Node',
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
          config: node.data?.config || {},
          inputs: node.data?.inputs || {},
          outputs: node.data?.outputs || {},
        }));

        await db.insert(workflowNodes).values(nodesToInsert);
      }

      // Insert new connections if they exist
      if (data.canvasState.edges && data.canvasState.edges.length > 0) {
        const connectionsToInsert = data.canvasState.edges.map((edge: any) => ({
          workflowId: workflowId,
          connectionId: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label,
        }));

        await db.insert(workflowConnections).values(connectionsToInsert);
      }
    }

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [deletedWorkflow] = await db
      .delete(workflows)
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, session.user.id)
        )
      )
      .returning();

    if (!deletedWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}