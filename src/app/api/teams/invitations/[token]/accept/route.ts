import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { teams, teamMembers, teamInvitations, teamActivityLogs } from '@/core/database/schemas';
import { eq, and, gt } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';

interface Params {
  params: Promise<{
    token: string;
  }>;
}

// POST /api/teams/invitations/[token]/accept - Accept an invitation
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(request);
    const { token } = await params;
    const userId = session.user.id;
    const userEmail = session.user.email;

    // Find invitation by token
    const invitations = await db
      .select()
      .from(teamInvitations)
      .where(eq(teamInvitations.token, token))
      .limit(1);

    if (invitations.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const invitation = invitations[0];

    // Check if invitation is for the current user
    if (invitation.email !== userEmail) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address' },
        { status: 403 }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation has already been accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, invitation.teamId),
          eq(teamMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 400 }
      );
    }

    // Start transaction (using multiple queries since Drizzle doesn't have built-in transactions for all drivers)
    try {
      // Add user to team
      const permissions = invitation.role === 'admin'
        ? {
            canInviteMembers: true,
            canRemoveMembers: true,
            canEditTeam: true,
            canManageApps: true,
            canViewBilling: false,
          }
        : invitation.role === 'viewer'
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

      await db.insert(teamMembers).values({
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
        permissions,
      });

      // Update invitation status
      await db
        .update(teamInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teamInvitations.id, invitation.id));

      // Log activity
      await db.insert(teamActivityLogs).values({
        teamId: invitation.teamId,
        userId,
        action: 'invitation_accepted',
        details: {
          invitationId: invitation.id,
          role: invitation.role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully',
      });
    } catch (error) {
      console.error('Error during transaction:', error);
      // Try to rollback by removing the member if they were added
      try {
        await db
          .delete(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, invitation.teamId),
              eq(teamMembers.userId, userId)
            )
          );
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}