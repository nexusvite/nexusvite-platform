import { db } from '@/core/database';
import { apps, appCategories, appCategoryMappings } from '@/core/database/schemas/apps';
import { installations } from '@/core/database/schemas/installations';
import { eq, and, sql } from 'drizzle-orm';

// Export interfaces for compatibility
export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  vendor: {
    name: string;
    email: string;
    url: string;
  };
  icon?: string;
  homepage: string;
  category: string;
  tags: string[];
  authentication: {
    type: string;
    scopes: string[];
    callback_url: string;
  };
  permissions: {
    data: {
      read: string[];
      write: string[];
    };
    api: {
      endpoints: string[];
    };
  };
  pricing?: {
    model: string;
    plans: {
      id: string;
      name: string;
      price: number;
      features: string[];
    }[];
  };
  webhooks?: {
    install?: string;
    uninstall?: string;
    update?: string;
  };
}

export interface InstalledApp {
  id: string;
  appId: string;
  userId: string;
  organizationId?: string;
  manifest: AppManifest;
  installDate: Date;
  status: 'active' | 'suspended' | 'pending';
  settings?: Record<string, unknown>;
}

// In-memory storage for demo installations (will be replaced with database later)
const installedApps: InstalledApp[] = [];

export class AppRegistry {
  // Get all available apps from database
  static async getAllApps(): Promise<AppManifest[]> {
    try {
      const result = await db.select().from(apps).where(eq(apps.status, 'active'));

      // Return manifest from each app
      return result.map(app => {
        const manifest = app.manifest as any;
        return {
          id: app.id,
          name: app.name,
          version: app.version,
          description: app.description,
          vendor: manifest.vendor || {
            name: app.author,
            email: 'support@nexusvite.com',
            url: 'https://nexusvite.com'
          },
          icon: manifest.icon,
          homepage: manifest.homepage,
          category: manifest.category || 'general',
          tags: manifest.tags || [],
          authentication: manifest.authentication || {
            type: 'oauth2',
            scopes: [],
            callback_url: '/api/auth/callback'
          },
          permissions: manifest.permissions || app.permissions || {
            data: { read: [], write: [] },
            api: { endpoints: [] }
          },
          pricing: manifest.pricing,
          webhooks: manifest.webhooks
        } as AppManifest;
      });
    } catch (error) {
      console.error('Error fetching apps from database:', error);
      return [];
    }
  }

  // Get apps by category from database
  static async getAppsByCategory(category: string): Promise<AppManifest[]> {
    try {
      // First get the category
      const categoryResult = await db
        .select()
        .from(appCategories)
        .where(eq(appCategories.slug, category))
        .limit(1);

      if (categoryResult.length === 0) {
        return [];
      }

      // Get apps in this category
      const appMappings = await db
        .select()
        .from(appCategoryMappings)
        .where(eq(appCategoryMappings.categoryId, categoryResult[0].id));

      const appIds = appMappings.map(mapping => mapping.appId);

      if (appIds.length === 0) {
        return [];
      }

      // Get the apps
      const appsResult = await db
        .select()
        .from(apps)
        .where(and(
          eq(apps.status, 'active'),
          sql`${apps.id} IN (${sql.join(appIds, sql`, `)})`
        ));

      return appsResult.map(app => {
        const manifest = app.manifest as any;
        return {
          id: app.id,
          name: app.name,
          version: app.version,
          description: app.description,
          vendor: manifest.vendor || {
            name: app.author,
            email: 'support@nexusvite.com',
            url: 'https://nexusvite.com'
          },
          icon: manifest.icon,
          homepage: manifest.homepage,
          category: category,
          tags: manifest.tags || [],
          authentication: manifest.authentication || {
            type: 'oauth2',
            scopes: [],
            callback_url: '/api/auth/callback'
          },
          permissions: manifest.permissions || app.permissions || {
            data: { read: [], write: [] },
            api: { endpoints: [] }
          },
          pricing: manifest.pricing,
          webhooks: manifest.webhooks
        } as AppManifest;
      });
    } catch (error) {
      console.error('Error fetching apps by category:', error);
      return [];
    }
  }

  // Search apps in database
  static async searchApps(query: string): Promise<AppManifest[]> {
    try {
      const result = await db
        .select()
        .from(apps)
        .where(and(
          eq(apps.status, 'active'),
          sql`(
            ${apps.name} ILIKE ${`%${query}%`} OR
            ${apps.description} ILIKE ${`%${query}%`}
          )`
        ));

      return result.map(app => {
        const manifest = app.manifest as any;
        return {
          id: app.id,
          name: app.name,
          version: app.version,
          description: app.description,
          vendor: manifest.vendor || {
            name: app.author,
            email: 'support@nexusvite.com',
            url: 'https://nexusvite.com'
          },
          icon: manifest.icon,
          homepage: manifest.homepage,
          category: manifest.category || 'general',
          tags: manifest.tags || [],
          authentication: manifest.authentication || {
            type: 'oauth2',
            scopes: [],
            callback_url: '/api/auth/callback'
          },
          permissions: manifest.permissions || app.permissions || {
            data: { read: [], write: [] },
            api: { endpoints: [] }
          },
          pricing: manifest.pricing,
          webhooks: manifest.webhooks
        } as AppManifest;
      });
    } catch (error) {
      console.error('Error searching apps:', error);
      return [];
    }
  }

  // Get app by ID from database
  static async getAppById(appId: string): Promise<AppManifest | null> {
    try {
      const result = await db
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const app = result[0];
      const manifest = app.manifest as any;

      return {
        id: app.id,
        name: app.name,
        version: app.version,
        description: app.description,
        vendor: manifest.vendor || {
          name: app.author,
          email: 'support@nexusvite.com',
          url: 'https://nexusvite.com'
        },
        icon: manifest.icon,
        homepage: manifest.homepage,
        category: manifest.category || 'general',
        tags: manifest.tags || [],
        authentication: manifest.authentication || {
          type: 'oauth2',
          scopes: [],
          callback_url: '/api/auth/callback'
        },
        permissions: manifest.permissions || app.permissions || {
          data: { read: [], write: [] },
          api: { endpoints: [] }
        },
        pricing: manifest.pricing,
        webhooks: manifest.webhooks
      } as AppManifest;
    } catch (error) {
      console.error('Error fetching app by ID:', error);
      return null;
    }
  }

  // Install an app for a user (temporarily using in-memory storage)
  static async installApp(appId: string, userId: string, organizationId?: string): Promise<InstalledApp> {
    const manifest = await this.getAppById(appId);
    if (!manifest) {
      throw new Error(`App ${appId} not found`);
    }

    // Check if already installed
    const existing = installedApps.find(
      app => app.appId === appId && app.userId === userId
    );
    if (existing) {
      throw new Error(`App ${appId} is already installed`);
    }

    const installation: InstalledApp = {
      id: `install_${Date.now()}`,
      appId,
      userId,
      ...(organizationId && { organizationId }),
      manifest,
      installDate: new Date(),
      status: 'active',
      settings: {}
    };

    installedApps.push(installation);
    return installation;
  }

  // Uninstall an app
  static async uninstallApp(installationId: string, userId: string): Promise<void> {
    const index = installedApps.findIndex(
      app => app.id === installationId && app.userId === userId
    );

    if (index === -1) {
      throw new Error(`Installation ${installationId} not found`);
    }

    const installation = installedApps[index];

    // Send webhook to the app if it has a webhook URL
    if (installation?.manifest.webhooks?.uninstall) {
      try {
        const webhookUrl = installation.manifest.webhooks.uninstall;
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'uninstall',
            installationId,
            userId,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send uninstall webhook:', error);
      }
    }

    installedApps.splice(index, 1);
  }

  // Get installed apps for a user
  static async getInstalledApps(userId: string): Promise<InstalledApp[]> {
    return installedApps.filter(app => app.userId === userId);
  }

  // Get installation by ID
  static async getInstallation(installationId: string, userId: string): Promise<InstalledApp | null> {
    return installedApps.find(
      app => app.id === installationId && app.userId === userId
    ) || null;
  }

  // Update app settings
  static async updateAppSettings(
    installationId: string,
    userId: string,
    settings: Record<string, unknown>
  ): Promise<InstalledApp> {
    const installation = installedApps.find(
      app => app.id === installationId && app.userId === userId
    );

    if (!installation) {
      throw new Error(`Installation ${installationId} not found`);
    }

    installation.settings = { ...installation.settings, ...settings };
    return installation;
  }

  // Check if app is installed
  static async isAppInstalled(appId: string, userId: string): Promise<boolean> {
    return installedApps.some(
      app => app.appId === appId && app.userId === userId
    );
  }
}