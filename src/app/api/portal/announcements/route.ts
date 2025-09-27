import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/auth/session';

// Mock announcements API - In production, this would use the portal_announcements table

// GET /api/portal/announcements - Get active announcements
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Return mock data for now
    return NextResponse.json({
      announcements: [
        {
          id: '1',
          title: 'Welcome to the Portal',
          content: 'Access all your applications and tools in one place',
          type: 'info',
          priority: 'normal',
          createdAt: new Date(),
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}