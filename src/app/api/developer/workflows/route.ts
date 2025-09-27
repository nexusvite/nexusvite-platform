import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { workflows } from '@/core/database/schemas/workflows';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/core/auth/config';

// GET - List all workflows for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWorkflows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, session.user.id))
      .orderBy(desc(workflows.createdAt));

    return NextResponse.json({ workflows: userWorkflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, canvasState } = data;

    // Create the workflow
    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        name,
        description,
        canvasState: canvasState || {},
        userId: session.user.id,
        active: false,
      })
      .returning();

    return NextResponse.json({ workflow: newWorkflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}