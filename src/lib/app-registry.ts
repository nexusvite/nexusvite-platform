// App Registry for managing installed apps
interface AppManifest {
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
    plans: any[];
  };
  webhooks?: {
    install?: string;
    uninstall?: string;
    update?: string;
  };
}

interface InstalledApp {
  id: string;
  appId: string;
  userId: string;
  organizationId?: string;
  manifest: AppManifest;
  installDate: Date;
  status: 'active' | 'suspended' | 'pending';
  settings?: Record<string, any>;
}

// Hardcoded app store for demo
const APP_STORE: AppManifest[] = [
  {
    id: "com.nexusvite.analytics",
    name: "Analytics Dashboard",
    version: "1.0.0",
    description: "Advanced analytics and reporting for NexusVite platform",
    vendor: {
      name: "NexusVite",
      email: "support@nexusvite.com",
      url: "https://nexusvite.com"
    },
    icon: "/apps/analytics-icon.png",
    homepage: "http://localhost:3001",
    category: "analytics",
    tags: ["analytics", "reports", "dashboard", "metrics"],
    authentication: {
      type: "oauth2",
      scopes: ["read:users", "read:organizations", "read:apps", "read:transactions"],
      callback_url: "/api/auth/callback"
    },
    permissions: {
      data: {
        read: ["users", "organizations", "apps", "transactions"],
        write: []
      },
      api: {
        endpoints: ["/api/v1/analytics/*", "/api/v1/reports/*"]
      }
    },
    pricing: {
      model: "freemium",
      plans: [
        {
          id: "free",
          name: "Free",
          price: 0,
          features: ["Basic analytics", "7-day data retention", "Up to 1,000 events/month"]
        },
        {
          id: "pro",
          name: "Pro",
          price: 29,
          features: ["Advanced analytics", "90-day data retention", "Unlimited events", "Custom reports", "API access"]
        }
      ]
    },
    webhooks: {
      install: "http://localhost:3001/api/webhooks/install",
      uninstall: "http://localhost:3001/api/webhooks/uninstall",
      update: "http://localhost:3001/api/webhooks/update"
    }
  },
  {
    id: "com.nexusvite.crm",
    name: "Customer CRM",
    version: "2.0.0",
    description: "Complete customer relationship management solution",
    vendor: {
      name: "NexusVite",
      email: "support@nexusvite.com",
      url: "https://nexusvite.com"
    },
    icon: "/apps/crm-icon.png",
    homepage: "http://localhost:3002",
    category: "business",
    tags: ["crm", "customers", "sales", "contacts"],
    authentication: {
      type: "oauth2",
      scopes: ["read:users", "read:customers", "write:customers"],
      callback_url: "/api/auth/callback"
    },
    permissions: {
      data: {
        read: ["users", "customers", "organizations"],
        write: ["customers", "contacts", "deals"]
      },
      api: {
        endpoints: ["/api/v1/crm/*", "/api/v1/customers/*"]
      }
    },
    pricing: {
      model: "subscription",
      plans: [
        {
          id: "starter",
          name: "Starter",
          price: 19,
          features: ["Up to 1,000 contacts", "Basic CRM features", "Email integration"]
        },
        {
          id: "business",
          name: "Business",
          price: 49,
          features: ["Unlimited contacts", "Advanced automation", "Custom fields", "API access"]
        }
      ]
    }
  },
  {
    id: "com.nexusvite.inventory",
    name: "Inventory Manager",
    version: "1.5.0",
    description: "Real-time inventory tracking and management",
    vendor: {
      name: "NexusVite",
      email: "support@nexusvite.com",
      url: "https://nexusvite.com"
    },
    icon: "/apps/inventory-icon.png",
    homepage: "http://localhost:3003",
    category: "operations",
    tags: ["inventory", "stock", "warehouse", "products"],
    authentication: {
      type: "oauth2",
      scopes: ["read:products", "write:products", "read:inventory"],
      callback_url: "/api/auth/callback"
    },
    permissions: {
      data: {
        read: ["products", "inventory", "warehouses"],
        write: ["inventory", "stock_movements"]
      },
      api: {
        endpoints: ["/api/v1/inventory/*", "/api/v1/products/*"]
      }
    },
    pricing: {
      model: "tiered",
      plans: [
        {
          id: "small",
          name: "Small Business",
          price: 15,
          features: ["Up to 500 SKUs", "1 warehouse", "Basic reporting"]
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 99,
          features: ["Unlimited SKUs", "Multiple warehouses", "Advanced analytics", "API access"]
        }
      ]
    }
  }
];

// In-memory storage for demo (in production, use database)
let installedApps: InstalledApp[] = [];

export class AppRegistry {
  // Get all available apps from the store
  static async getAvailableApps(): Promise<AppManifest[]> {
    return APP_STORE;
  }

  // Get a specific app by ID
  static async getApp(appId: string): Promise<AppManifest | null> {
    return APP_STORE.find(app => app.id === appId) || null;
  }

  // Get installed apps for a user
  static async getInstalledApps(userId: string): Promise<InstalledApp[]> {
    return installedApps.filter(app => app.userId === userId);
  }

  // Install an app for a user
  static async installApp(appId: string, userId: string, organizationId?: string): Promise<InstalledApp> {
    const manifest = await this.getApp(appId);
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
      organizationId,
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
    if (installation.manifest.webhooks?.uninstall) {
      try {
        const webhookUrl = installation.manifest.webhooks.uninstall;
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'app.uninstalled',
            appId: installation.appId,
            userId: installation.userId,
            organizationId: installation.organizationId,
            installationId: installation.id,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to send uninstall webhook:', error);
        // Continue with uninstall even if webhook fails
      }
    }

    installedApps.splice(index, 1);
  }

  // Update app settings
  static async updateAppSettings(
    installationId: string,
    userId: string,
    settings: Record<string, any>
  ): Promise<InstalledApp> {
    const app = installedApps.find(
      app => app.id === installationId && app.userId === userId
    );

    if (!app) {
      throw new Error(`Installation ${installationId} not found`);
    }

    app.settings = { ...app.settings, ...settings };
    return app;
  }

  // Search apps
  static async searchApps(query: string): Promise<AppManifest[]> {
    const lowerQuery = query.toLowerCase();
    return APP_STORE.filter(app =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery) ||
      app.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Get apps by category
  static async getAppsByCategory(category: string): Promise<AppManifest[]> {
    return APP_STORE.filter(app => app.category === category);
  }
}