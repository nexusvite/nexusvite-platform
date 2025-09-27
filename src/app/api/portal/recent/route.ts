import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/auth/session';

// Mock recent apps API - In production, this would use the app_usage_tracking table

// GET /api/portal/recent - Get user's recently accessed apps
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Return mock data for now
    return NextResponse.json({
      recentApps: [],
    });
  } catch (error) {
    console.error('Error fetching recent apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent apps' },
      { status: 500 }
    );
  }
}