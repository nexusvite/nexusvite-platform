import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { teams, teamMembers, teamActivityLogs } from '@/core/database/schemas';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';

interface Params {
  params: Promise<{
    teamId: string;
  }>;
}

// GET /api/teams/[teamId] - Get team details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(request);
    const { teamId } = await params;
    const userId = session.user.id;

    // Check if user has access to this team
    const memberCheck = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      )
      .limit(1);

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or member
    if (team[0].ownerId !== userId && memberCheck.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...team[0],
      userRole: memberCheck[0]?.role || (team[0].ownerId === userId ? 'owner' : null),
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[teamId] - Update team details
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(request);
    const { teamId } = await params;
    const userId = session.user.id;
    const body = await request.json();

    // Check if user has permission to edit team
    const memberCheck = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      )
      .limit(1);

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isOwner = team[0].ownerId === userId;
    const canEdit = isOwner ||
      (memberCheck[0]?.role === 'admin' && memberCheck[0]?.permissions?.canEditTeam);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update team
    const { name, description, logo, settings } = body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (settings !== undefined) updateData.settings = settings;

    updateData.updatedAt = new Date();

    const [updatedTeam] = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, teamId))
      .returning();

    // Log activity
    await db.insert(teamActivityLogs).values({
      teamId,
      userId,
      action: 'team_updated',
      details: { changes: Object.keys(updateData) },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(request);
    const { teamId } = await params;
    const userId = session.user.id;

    // Only owner can delete team
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team[0].ownerId !== userId) {
      return NextResponse.json(
        { error: 'Only team owner can delete the team' },
        { status: 403 }
      );
    }

    // Delete team (cascades to members, invitations, and logs)
    await db.delete(teams).where(eq(teams.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}