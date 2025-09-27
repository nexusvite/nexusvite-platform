import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { teams, teamMembers, user, teamActivityLogs } from '@/core/database/schemas';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';

interface Params {
  params: Promise<{
    teamId: string;
  }>;
}

// GET /api/teams/[teamId]/members - Get all team members
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

    // Get all team members with user details
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        permissions: teamMembers.permissions,
        joinedAt: teamMembers.joinedAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      })
      .from(teamMembers)
      .innerJoin(user, eq(teamMembers.userId, user.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(teamMembers.joinedAt);

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/members - Add a team member (direct add, not invitation)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(request);
    const { teamId } = await params;
    const userId = session.user.id;
    const body = await request.json();

    const { email, role = 'member' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to add members
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
    const canInvite = isOwner ||
      (memberCheck[0]?.role === 'admin' && memberCheck[0]?.permissions?.canInviteMembers);

    if (!canInvite) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Find user by email
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, targetUser[0].id)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Add member to team
    const permissions = role === 'admin'
      ? {
          canInviteMembers: true,
          canRemoveMembers: true,
          canEditTeam: true,
          canManageApps: true,
          canViewBilling: false,
        }
      : role === 'viewer'
      ? {
          canInviteMembers: false,
          canRemoveMembers: false,
          canEditTeam: false,
          canManageApps: false,
          canViewBilling: false,
        }
      : {
          canInviteMembers: false,
          canRemoveMembers: false,
          canEditTeam: false,
          canManageApps: true,
          canViewBilling: false,
        };

    const [newMember] = await db
      .insert(teamMembers)
      .values({
        teamId,
        userId: targetUser[0].id,
        role,
        permissions,
      })
      .returning();

    // Log activity
    await db.insert(teamActivityLogs).values({
      teamId,
      userId,
      action: 'member_added',
      targetUserId: targetUser[0].id,
      details: { role },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      ...newMember,
      user: targetUser[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}