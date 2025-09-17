import { db } from '../index';
import { appCategories } from '../schemas';
import { config } from '@/core/config';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const testResult = await db.execute('SELECT 1 as test');
    if (!testResult) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');

    // Seed app categories
    console.log('📦 Seeding app categories...');
    const categories = [
      {
        name: 'Productivity',
        description: 'Apps that help you get work done efficiently',
        slug: 'productivity',
      },
      {
        name: 'E-commerce',
        description: 'Online store and shopping applications',
        slug: 'ecommerce',
      },
      {
        name: 'Analytics',
        description: 'Data analysis and reporting tools',
        slug: 'analytics',
      },
      {
        name: 'Communication',
        description: 'Chat, messaging, and collaboration tools',
        slug: 'communication',
      },
      {
        name: 'Marketing',
        description: 'Marketing automation and campaign tools',
        slug: 'marketing',
      },
      {
        name: 'Finance',
        description: 'Financial management and accounting apps',
        slug: 'finance',
      },
      {
        name: 'Social',
        description: 'Social media and community applications',
        slug: 'social',
      },
      {
        name: 'Utilities',
        description: 'Helpful utility and tool applications',
        slug: 'utilities',
      },
    ];

    for (const category of categories) {
      await db.insert(appCategories).values(category).onConflictDoNothing();
    }

    console.log('✅ App categories seeded successfully');
    console.log('🎉 Database seed completed!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export default seed;