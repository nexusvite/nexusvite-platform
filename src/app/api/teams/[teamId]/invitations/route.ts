import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { teams, teamMembers, teamInvitations, teamActivityLogs, user } from '@/core/database/schemas';
import { eq, and, gt } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';
import { randomBytes } from 'crypto';

interface Params {
  params: Promise<{
    teamId: string;
  }>;
}

// GET /api/teams/[teamId]/invitations - Get all team invitations
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

    // Check if user is owner or admin
    const isOwner = team[0].ownerId === userId;
    const isAdmin = memberCheck[0]?.role === 'admin';

    if (!isOwner && !isAdmin && memberCheck.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all pending invitations
    const invitations = await db
      .select({
        id: teamInvitations.id,
        email: teamInvitations.email,
        role: teamInvitations.role,
        status: teamInvitations.status,
        expiresAt: teamInvitations.expiresAt,
        createdAt: teamInvitations.createdAt,
        invitedBy: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(teamInvitations)
      .innerJoin(user, eq(teamInvitations.invitedBy, user.id))
      .where(
        and(
          eq(teamInvitations.teamId, teamId),
          gt(teamInvitations.expiresAt, new Date())
        )
      )
      .orderBy(teamInvitations.createdAt);

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/invitations - Create a new invitation
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

    // Check if user has permission to invite members
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
        { error: 'Permission denied to invite members' },
        { status: 403 }
      );
    }

    // Check if team allows invitations
    if (team[0].settings?.allowInvitations === false && !isOwner) {
      return NextResponse.json(
        { error: 'Team invitations are disabled' },
        { status: 403 }
      );
    }

    // Check if user already exists and is a member
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const existingMember = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, existingUser[0].id)
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        return NextResponse.json(
          { error: 'User is already a team member' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.teamId, teamId),
          eq(teamInvitations.email, email),
          eq(teamInvitations.status, 'pending'),
          gt(teamInvitations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return NextResponse.json(
        { error: 'An invitation for this email already exists' },
        { status: 400 }
      );
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [invitation] = await db
      .insert(teamInvitations)
      .values({
        teamId,
        email,
        role,
        invitedBy: userId,
        token,
        expiresAt,
      })
      .returning();

    // Log activity
    await db.insert(teamActivityLogs).values({
      teamId,
      userId,
      action: 'invitation_sent',
      details: { email, role },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    // TODO: Send invitation email here
    // await sendInvitationEmail(email, team[0].name, token);

    return NextResponse.json({
      ...invitation,
      inviteUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/teams/invitations/${token}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}