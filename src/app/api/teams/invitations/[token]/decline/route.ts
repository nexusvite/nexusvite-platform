import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { teamInvitations, teamActivityLogs } from '@/core/database/schemas';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';

interface Params {
  params: Promise<{
    token: string;
  }>;
}

// POST /api/teams/invitations/[token]/decline - Decline an invitation
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

    // Check if invitation has already been processed
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    // Update invitation status to declined
    await db
      .update(teamInvitations)
      .set({
        status: 'declined',
        updatedAt: new Date(),
      })
      .where(eq(teamInvitations.id, invitation.id));

    // Log activity
    await db.insert(teamActivityLogs).values({
      teamId: invitation.teamId,
      userId,
      action: 'invitation_declined',
      details: {
        invitationId: invitation.id,
        email: invitation.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation declined successfully',
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      { error: 'Failed to decline invitation' },
      { status: 500 }
    );
  }
}