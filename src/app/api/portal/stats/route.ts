import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { installations, apps } from '@/core/database/schemas';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';

// GET /api/portal/stats - Get portal statistics for the user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = session.user.id;

    // Get total and active apps count
    const appsCount = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(case when ${installations.status} = 'active' then 1 end)`,
      })
      .from(installations)
      .innerJoin(apps, eq(installations.appId, apps.id))
      .where(eq(installations.userId, userId));

    // For now, return mock data for favorites and recently used
    // In production, these would come from the portal tables
    const stats = {
      totalApps: Number(appsCount[0]?.total) || 0,
      activeApps: Number(appsCount[0]?.active) || 0,
      recentlyUsed: 0, // This would come from app_usage_tracking table
      favorites: 0, // This would come from portal_preferences table
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching portal stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}