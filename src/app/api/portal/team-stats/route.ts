import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/auth/session';
import { db } from '@/core/database';
import { teamMembers } from '@/core/database/schemas';
import { sql } from 'drizzle-orm';

// GET /api/portal/team-stats - Get team statistics
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = session.user.id;

    // Get team member count if user is part of a team
    const memberCount = await db
      .select({
        count: sql<number>`count(distinct ${teamMembers.userId})`,
      })
      .from(teamMembers);

    return NextResponse.json({
      memberCount: Number(memberCount[0]?.count) || 0,
      activeMembers: 0, // Mock data
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team statistics' },
      { status: 500 }
    );
  }
}