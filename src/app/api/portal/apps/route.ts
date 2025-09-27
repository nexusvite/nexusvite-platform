import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/database';
import { installations, apps } from '@/core/database/schemas';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/core/auth/session';

// GET /api/portal/apps - Get user's accessible apps
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const userId = session.user.id;

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Get user's installed apps with full app details
    const userApps = await db
      .select({
        installation: installations,
        app: apps,
      })
      .from(installations)
      .innerJoin(apps, eq(installations.appId, apps.id))
      .where(
        and(
          eq(installations.userId, userId),
          eq(installations.status, 'active'),
          eq(apps.status, 'active')
        )
      )
      .limit(limit || 100);

    // Format response with app details
    const formattedApps = userApps.map(({ installation, app }) => {
      const manifest = app.manifest as any;

      // For the analytics app, we want the direct URL without platform wrapper
      let appUrl = '';
      let navigationItems = [];

      if (app.id === 'com.nexusvite.analytics' || app.name === 'Analytics') {
        // Direct URL to the analytics app
        appUrl = 'http://localhost:3001';

        // Define navigation items for the analytics app
        navigationItems = [
          {
            id: 'analytics-dashboard',
            title: 'Dashboard',
            path: '/portal/app/analytics-dashboard',
            slug: 'analytics-dashboard',
            url: 'http://localhost:3001',
            icon: 'chart',
          },
          {
            id: 'analytics-reports',
            title: 'Reports',
            path: '/portal/app/analytics-reports',
            slug: 'analytics-reports',
            url: 'http://localhost:3001/reports',
            icon: 'file-text',
          },
          {
            id: 'analytics-settings',
            title: 'Settings',
            path: '/portal/app/analytics-settings',
            slug: 'analytics-settings',
            url: 'http://localhost:3001/settings',
            icon: 'settings',
          },
        ];
      } else if (manifest?.url) {
        appUrl = manifest.url;

        // Check if manifest has navigation items defined
        if (manifest.navigation && Array.isArray(manifest.navigation)) {
          navigationItems = manifest.navigation.map((item: any) => ({
            id: `${app.id}-${item.id || item.title.toLowerCase().replace(/\s+/g, '-')}`,
            title: item.title,
            path: `/portal/app/${app.name.toLowerCase().replace(/\s+/g, '-')}-${item.id || item.title.toLowerCase().replace(/\s+/g, '-')}`,
            slug: `${app.name.toLowerCase().replace(/\s+/g, '-')}-${item.id || item.title.toLowerCase().replace(/\s+/g, '-')}`,
            url: item.url || `${manifest.url}${item.path || ''}`,
            icon: item.icon || 'file',
          }));
        }
      } else {
        // Use the installation view URL with embedded parameter
        appUrl = `/dashboard/apps/${installation.id}/view?embedded=true`;
      }

      return {
        id: app.id,
        name: app.name,
        description: app.description,
        version: app.version,
        author: app.author,
        manifest: app.manifest,
        status: app.status,
        installationId: installation.id,
        installedAt: installation.installedAt,
        settings: installation.settings,
        // Add additional metadata for the portal
        icon: manifest?.icon || 'package',
        category: manifest?.category || 'other',
        external: manifest?.external || (app.id === 'com.nexusvite.analytics'),
        url: appUrl,
        // For portal navigation - use a simple slug
        slug: app.name.toLowerCase().replace(/\s+/g, '-'),
        // Navigation items for this app
        navigation: navigationItems,
      };
    });

    return NextResponse.json({
      apps: formattedApps,
      total: formattedApps.length,
    });
  } catch (error) {
    console.error('Error fetching portal apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}