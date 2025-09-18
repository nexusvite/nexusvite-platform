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
  manifest: AppManifest;
  installDate: Date;
  status: 'active' | 'inactive';
  settings?: Record<string, unknown>;
}

// Removed in-memory storage - now using database

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

  // Install an app for a user in database
  static async installApp(appId: string, userId: string): Promise<InstalledApp> {
    const manifest = await this.getAppById(appId);
    if (!manifest) {
      throw new Error(`App ${appId} not found`);
    }

    // Check if already installed
    const existing = await db
      .select()
      .from(installations)
      .where(and(
        eq(installations.appId, appId),
        eq(installations.userId, userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`App ${appId} is already installed`);
    }

    const { createId } = await import('@paralleldrive/cuid2');
    const installationId = createId();

    // Insert into database
    await db.insert(installations).values({
      id: installationId,
      appId,
      userId,
      settings: {
        embedMode: true // Default to embedded mode
      },
      status: 'active',
      installedAt: new Date(),
      updatedAt: new Date()
    });

    const installation: InstalledApp = {
      id: installationId,
      appId,
      userId,
      manifest,
      installDate: new Date(),
      status: 'active',
      settings: {
        embedMode: true
      }
    };

    return installation;
  }

  // Uninstall an app from database
  static async uninstallApp(installationId: string, userId: string): Promise<void> {
    // Get installation first to send webhook
    const installation = await this.getInstallation(installationId, userId);

    if (!installation) {
      throw new Error(`Installation ${installationId} not found`);
    }

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

    // Delete from database
    await db
      .delete(installations)
      .where(and(
        eq(installations.id, installationId),
        eq(installations.userId, userId)
      ));
  }

  // Get installed apps for a user from database
  static async getInstalledApps(userId: string): Promise<InstalledApp[]> {
    try {
      const result = await db
        .select()
        .from(installations)
        .where(eq(installations.userId, userId));

      // Get app manifests for each installation
      const installedAppsData: InstalledApp[] = [];

      for (const installation of result) {
        const manifest = await this.getAppById(installation.appId);
        if (manifest) {
          installedAppsData.push({
            id: installation.id,
            appId: installation.appId,
            userId: installation.userId,
            manifest,
            installDate: installation.installedAt,
            status: installation.status as 'active' | 'inactive',
            settings: installation.settings as Record<string, unknown>
          });
        }
      }

      return installedAppsData;
    } catch (error) {
      console.error('Error fetching installed apps:', error);
      return [];
    }
  }

  // Get installation by ID from database
  static async getInstallation(installationId: string, userId: string): Promise<InstalledApp | null> {
    try {
      const result = await db
        .select()
        .from(installations)
        .where(and(
          eq(installations.id, installationId),
          eq(installations.userId, userId)
        ))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const installation = result[0];
      const manifest = await this.getAppById(installation.appId);

      if (!manifest) {
        return null;
      }

      return {
        id: installation.id,
        appId: installation.appId,
        userId: installation.userId,
        manifest,
        installDate: installation.installedAt,
        status: installation.status as 'active' | 'inactive',
        settings: installation.settings as Record<string, unknown>
      };
    } catch (error) {
      console.error('Error fetching installation:', error);
      return null;
    }
  }

  // Update app settings in database
  static async updateAppSettings(
    installationId: string,
    userId: string,
    settings: Record<string, unknown>
  ): Promise<InstalledApp> {
    // Get current installation
    const installation = await this.getInstallation(installationId, userId);

    if (!installation) {
      throw new Error(`Installation ${installationId} not found`);
    }

    // Merge settings
    const updatedSettings = { ...installation.settings, ...settings };

    // Update in database
    await db
      .update(installations)
      .set({ settings: updatedSettings })
      .where(and(
        eq(installations.id, installationId),
        eq(installations.userId, userId)
      ));

    installation.settings = updatedSettings;
    return installation;
  }

  // Check if app is installed in database
  static async isAppInstalled(appId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(installations)
        .where(and(
          eq(installations.appId, appId),
          eq(installations.userId, userId)
        ));

      return result[0].count > 0;
    } catch (error) {
      console.error('Error checking app installation:', error);
      return false;
    }
  }
}