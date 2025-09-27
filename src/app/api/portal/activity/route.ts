import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/auth/session';

// Mock activity API - In production, this would use the app_usage_tracking and team_activity_logs tables

// GET /api/portal/activity - Get recent activity
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Return mock data for now
    return NextResponse.json({
      activities: [
        {
          id: '1',
          type: 'app_access',
          title: 'Analytics App Accessed',
          description: 'You accessed the Analytics application',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
        {
          id: '2',
          type: 'team_activity',
          title: 'Team Member Added',
          description: 'New team member joined your workspace',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}