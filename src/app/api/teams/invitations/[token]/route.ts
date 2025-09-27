import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { teams, teamMembers, teamInvitations, user, teamActivityLogs } from '@/core/database/schemas';
import { eq, and, gt } from 'drizzle-orm';
import { getSession } from '@/core/auth/session';

interface Params {
  params: Promise<{
    token: string;
  }>;
}

// GET /api/teams/invitations/[token] - Get invitation details by token
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;

    // Find invitation by token
    const invitations = await db
      .select({
        invitation: teamInvitations,
        team: {
          id: teams.id,
          name: teams.name,
          description: teams.description,
        },
        invitedBy: {
          name: user.name,
          email: user.email,
        },
      })
      .from(teamInvitations)
      .innerJoin(teams, eq(teamInvitations.teamId, teams.id))
      .innerJoin(user, eq(teamInvitations.invitedBy, user.id))
      .where(eq(teamInvitations.token, token))
      .limit(1);

    if (invitations.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const invitation = invitations[0];

    // Get member count for the team
    const memberCount = await db
      .select({ count: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, invitation.team.id));

    return NextResponse.json({
      id: invitation.invitation.id,
      teamId: invitation.invitation.teamId,
      email: invitation.invitation.email,
      role: invitation.invitation.role,
      status: invitation.invitation.status,
      expiresAt: invitation.invitation.expiresAt,
      team: {
        ...invitation.team,
        memberCount: memberCount.length,
      },
      invitedBy: invitation.invitedBy,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}