import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { teams, teamMembers, user } from '@/core/database/schemas';
import { eq, and, or, sql, desc } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';

// GET /api/teams - Get all teams for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = session.user.id;

    // Get all teams where user is either owner or member
    const userTeams = await db
      .select({
        team: teams,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        memberCount: sql<number>`COUNT(DISTINCT tm.user_id)::int`,
      })
      .from(teams)
      .leftJoin(
        teamMembers,
        and(
          eq(teamMembers.teamId, teams.id),
          eq(teamMembers.userId, userId)
        )
      )
      .leftJoin(
        sql`${teamMembers} as tm`,
        sql`tm.team_id = ${teams.id}`
      )
      .where(
        or(
          eq(teams.ownerId, userId),
          eq(teamMembers.userId, userId)
        )
      )
      .groupBy(teams.id, teamMembers.role, teamMembers.joinedAt)
      .orderBy(desc(teams.createdAt));

    return NextResponse.json(userTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = session.user.id;
    const body = await request.json();

    const { name, description, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.slug, slug))
      .limit(1);

    if (existingTeam.length > 0) {
      return NextResponse.json(
        { error: 'Team slug already exists' },
        { status: 400 }
      );
    }

    // Create the team
    const [newTeam] = await db
      .insert(teams)
      .values({
        name,
        slug,
        description: description || null,
        ownerId: userId,
      })
      .returning();

    // Add the owner as a team member with owner role
    await db.insert(teamMembers).values({
      teamId: newTeam.id,
      userId,
      role: 'owner',
      permissions: {
        canInviteMembers: true,
        canRemoveMembers: true,
        canEditTeam: true,
        canManageApps: true,
        canViewBilling: true,
      },
    });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}