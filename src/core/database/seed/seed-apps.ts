import { db } from '../index';
import { apps, appCategories, appCategoryMappings } from '../schemas/apps';
import { developers } from '../schemas/developers';
import { users } from '../schemas/users';
import { eq } from 'drizzle-orm';

// App manifests to seed
const APP_MANIFESTS = [
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
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 99,
          features: ["Everything in Pro", "Unlimited data retention", "Custom integrations", "Dedicated support", "SLA"]
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
    name: "Customer Relationship Manager",
    version: "2.1.0",
    description: "Complete CRM solution for managing customer relationships",
    vendor: {
      name: "NexusVite",
      email: "support@nexusvite.com",
      url: "https://nexusvite.com"
    },
    homepage: "https://crm.nexusvite.com",
    category: "business",
    tags: ["crm", "sales", "customers", "contacts"],
    authentication: {
      type: "api_key",
      scopes: ["read:contacts", "write:contacts", "read:deals", "write:deals"],
      callback_url: "/api/auth/callback"
    },
    permissions: {
      data: {
        read: ["contacts", "deals", "companies", "activities"],
        write: ["contacts", "deals", "companies", "activities"]
      },
      api: {
        endpoints: ["/api/v1/crm/*", "/api/v1/contacts/*", "/api/v1/deals/*"]
      }
    },
    pricing: {
      model: "per_user",
      plans: [
        {
          id: "starter",
          name: "Starter",
          price: 12,
          features: ["Up to 3 users", "1,000 contacts", "Basic features"]
        },
        {
          id: "professional",
          name: "Professional",
          price: 25,
          features: ["Up to 10 users", "10,000 contacts", "Advanced features", "API access"]
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 49,
          features: ["Unlimited users", "Unlimited contacts", "All features", "Priority support"]
        }
      ]
    }
  },
  {
    id: "com.nexusvite.inventory",
    name: "Inventory Management System",
    version: "1.5.0",
    description: "Track and manage inventory, stock levels, and supply chain",
    vendor: {
      name: "NexusVite",
      email: "support@nexusvite.com",
      url: "https://nexusvite.com"
    },
    homepage: "https://inventory.nexusvite.com",
    category: "operations",
    tags: ["inventory", "warehouse", "stock", "supply-chain"],
    authentication: {
      type: "oauth2",
      scopes: ["read:inventory", "write:inventory", "read:orders", "write:orders"],
      callback_url: "/api/auth/callback"
    },
    permissions: {
      data: {
        read: ["products", "inventory", "warehouses", "suppliers"],
        write: ["products", "inventory", "warehouses", "suppliers"]
      },
      api: {
        endpoints: ["/api/v1/inventory/*", "/api/v1/products/*", "/api/v1/warehouses/*"]
      }
    },
    pricing: {
      model: "tiered",
      plans: [
        {
          id: "basic",
          name: "Basic",
          price: 29,
          features: ["Up to 100 SKUs", "1 warehouse", "Basic reporting"]
        },
        {
          id: "standard",
          name: "Standard",
          price: 79,
          features: ["Up to 1,000 SKUs", "3 warehouses", "Advanced reporting", "Barcode scanning"]
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 199,
          features: ["Unlimited SKUs", "Multiple warehouses", "Advanced analytics", "API access"]
        }
      ]
    }
  }
];

const CATEGORIES = [
  {
    name: "Analytics",
    slug: "analytics",
    description: "Data analytics and reporting tools"
  },
  {
    name: "Business",
    slug: "business",
    description: "Business management and productivity tools"
  },
  {
    name: "Operations",
    slug: "operations",
    description: "Operations and workflow management tools"
  },
  {
    name: "Marketing",
    slug: "marketing",
    description: "Marketing and customer engagement tools"
  },
  {
    name: "Finance",
    slug: "finance",
    description: "Financial management and accounting tools"
  },
  {
    name: "Developer Tools",
    slug: "developer-tools",
    description: "Tools for developers and technical teams"
  }
];

export async function seedApps() {
  console.log('🌱 Seeding app categories...');

  // Seed categories
  for (const category of CATEGORIES) {
    const existing = await db.select().from(appCategories).where(eq(appCategories.slug, category.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(appCategories).values(category);
      console.log(`✅ Created category: ${category.name}`);
    }
  }

  console.log('🌱 Seeding apps...');

  // Get or create system user
  let systemUser = await db.select().from(users).where(eq(users.email, 'system@nexusvite.com')).limit(1);
  if (systemUser.length === 0) {
    await db.insert(users).values({
      email: 'system@nexusvite.com',
      name: 'System',
      role: 'admin',
      emailVerified: new Date()
    });
    systemUser = await db.select().from(users).where(eq(users.email, 'system@nexusvite.com')).limit(1);
    console.log('✅ Created system user');
  }
  const systemUserId = systemUser[0].id;

  // Get or create NexusVite developer
  let developer = await db.select().from(developers).where(eq(developers.companyName, 'NexusVite')).limit(1);
  if (developer.length === 0) {
    await db.insert(developers).values({
      userId: systemUserId,
      companyName: 'NexusVite',
      website: 'https://nexusvite.com',
      verified: true
    });
    developer = await db.select().from(developers).where(eq(developers.companyName, 'NexusVite')).limit(1);
    console.log('✅ Created NexusVite developer');
  }
  const developerId = developer[0].id;

  // Seed apps
  for (const manifest of APP_MANIFESTS) {
    const existing = await db.select().from(apps).where(eq(apps.id, manifest.id)).limit(1);

    if (existing.length === 0) {
      // Insert app
      await db.insert(apps).values({
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.vendor.name,
        developerId: developerId,
        manifest: manifest,
        status: 'active',
        permissions: manifest.permissions
      });

      console.log(`✅ Created app: ${manifest.name}`);

      // Link to category
      const category = await db.select().from(appCategories).where(eq(appCategories.slug, manifest.category)).limit(1);
      if (category.length > 0) {
        await db.insert(appCategoryMappings).values({
          appId: manifest.id,
          categoryId: category[0].id
        });
      }
    } else {
      // Update existing app
      await db.update(apps)
        .set({
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          manifest: manifest,
          permissions: manifest.permissions,
          updatedAt: new Date()
        })
        .where(eq(apps.id, manifest.id));

      console.log(`🔄 Updated app: ${manifest.name}`);
    }
  }

  console.log('✅ App seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedApps()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}