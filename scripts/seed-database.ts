#!/usr/bin/env tsx
/**
 * Seed database with users and workflows for testing
 */

import { db } from '@/core/database';
import { workflows } from '@/core/database/schemas/workflows';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { hashPassword } from 'better-auth/crypto';

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  try {
    // Clean existing data
    console.log('🗑️ Cleaning existing data...');
    await db.execute(sql`DELETE FROM workflow_executions`);
    await db.execute(sql`DELETE FROM workflows`);
    await db.execute(sql`DELETE FROM account`);
    await db.execute(sql`DELETE FROM "user"`);
    console.log('✅ Cleaned existing data\n');

    // Create admin user using Better Auth structure
    console.log('👤 Creating admin user...');
    const adminId = createId();
    const hashedPassword = await hashPassword('admin123');

    await db.execute(sql`
      INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
      VALUES (${adminId}, 'admin@nexusvite.com', 'Admin User', true, NOW(), NOW())
    `);

    await db.execute(sql`
      INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES (${createId()}, ${adminId}, 'admin@nexusvite.com', 'credential', ${hashedPassword}, NOW(), NOW())
    `);

    console.log('✅ Admin user created');
    console.log('   Email: admin@nexusvite.com');
    console.log('   Password: admin123\n');

    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [
      { email: 'john.doe@example.com', name: 'John Doe', password: 'test123' },
      { email: 'jane.smith@example.com', name: 'Jane Smith', password: 'test123' },
    ];

    for (const testUser of testUsers) {
      const userId = createId();
      const hashedPwd = await hashPassword(testUser.password);

      await db.execute(sql`
        INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
        VALUES (${userId}, ${testUser.email}, ${testUser.name}, true, NOW(), NOW())
      `);

      await db.execute(sql`
        INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
        VALUES (${createId()}, ${userId}, ${testUser.email}, 'credential', ${hashedPwd}, NOW(), NOW())
      `);

      console.log(`   ✓ Created: ${testUser.email}`);
    }

    // Create sample workflows
    console.log('\n🔄 Creating sample workflows...');

    const workflow1 = await db.insert(workflows).values({
      id: createId(),
      name: 'Welcome Email Workflow',
      description: 'Sends welcome email to new users',
      active: true,
      triggerType: 'manual',
      userId: adminId,
      canvasState: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 200 },
            data: {
              subType: 'manual',
              label: 'Manual Trigger',
              config: {}
            }
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 400, y: 200 },
            data: {
              subType: 'email',
              label: 'Send Welcome Email',
              config: {
                to: '{{user.email}}',
                subject: 'Welcome to NexusVite!',
                body: 'Welcome {{user.name}}!'
              }
            }
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 700, y: 200 },
            data: {
              subType: 'database',
              label: 'Update User Status',
              config: {
                operation: 'update',
                table: 'users',
                set: { welcomed: true }
              }
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
          { id: 'e2-3', source: 'action-1', target: 'action-2' }
        ]
      }
    }).returning();

    console.log(`   ✓ Created: ${workflow1[0].name} (ID: ${workflow1[0].id})`);

    const workflow2 = await db.insert(workflows).values({
      id: createId(),
      name: 'Data Processing Pipeline',
      description: 'Processes incoming data through multiple stages',
      active: true,
      triggerType: 'webhook',
      userId: adminId,
      webhookPath: '/webhook/data-process',
      canvasState: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 200 },
            data: {
              subType: 'webhook',
              label: 'Webhook Trigger',
              config: { path: '/webhook/data-process' }
            }
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 400, y: 200 },
            data: {
              subType: 'http',
              label: 'Fetch External Data',
              config: {
                url: 'https://api.example.com/data',
                method: 'GET'
              }
            }
          },
          {
            id: 'logic-1',
            type: 'logic',
            position: { x: 700, y: 200 },
            data: {
              subType: 'condition',
              label: 'Check Data Valid',
              config: {
                condition: 'data.status === "valid"'
              }
            }
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 1000, y: 100 },
            data: {
              subType: 'database',
              label: 'Store Valid Data',
              config: {
                operation: 'insert',
                table: 'processed_data'
              }
            }
          },
          {
            id: 'action-3',
            type: 'action',
            position: { x: 1000, y: 300 },
            data: {
              subType: 'slack',
              label: 'Send Error Alert',
              config: {
                channel: '#alerts',
                message: 'Invalid data received'
              }
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
          { id: 'e2-3', source: 'action-1', target: 'logic-1' },
          { id: 'e3-4', source: 'logic-1', target: 'action-2', sourceHandle: 'true' },
          { id: 'e3-5', source: 'logic-1', target: 'action-3', sourceHandle: 'false' }
        ]
      }
    }).returning();

    console.log(`   ✓ Created: ${workflow2[0].name} (ID: ${workflow2[0].id})`);

    const workflow3 = await db.insert(workflows).values({
      id: createId(),
      name: 'Scheduled Report Generator',
      description: 'Generates reports every hour',
      active: false,
      triggerType: 'schedule',
      userId: adminId,
      schedule: '0 * * * *',
      canvasState: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 200 },
            data: {
              subType: 'schedule',
              label: 'Hourly Schedule',
              config: { cron: '0 * * * *' }
            }
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 400, y: 200 },
            data: {
              subType: 'database',
              label: 'Fetch Report Data',
              config: {
                operation: 'query',
                query: 'SELECT * FROM metrics WHERE created_at > NOW() - INTERVAL 1 HOUR'
              }
            }
          },
          {
            id: 'transform-1',
            type: 'transform',
            position: { x: 700, y: 200 },
            data: {
              subType: 'code',
              label: 'Generate Report',
              config: {
                code: 'return data.map(row => ({ ...row, formatted: true }))'
              }
            }
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 1000, y: 200 },
            data: {
              subType: 'email',
              label: 'Email Report',
              config: {
                to: 'team@example.com',
                subject: 'Hourly Report',
                attachReport: true
              }
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'action-1' },
          { id: 'e2-3', source: 'action-1', target: 'transform-1' },
          { id: 'e3-4', source: 'transform-1', target: 'action-2' }
        ]
      }
    }).returning();

    console.log(`   ✓ Created: ${workflow3[0].name} (ID: ${workflow3[0].id})`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Summary:');
    console.log('   - 1 admin user');
    console.log('   - 2 test users');
    console.log('   - 3 workflows');
    console.log('\nLogin credentials:');
    console.log('   admin@nexusvite.com / admin123');
    console.log('   john.doe@example.com / test123');
    console.log('   jane.smith@example.com / test123');
    console.log('\nWorkflow URLs:');
    console.log(`   http://localhost:3000/developer/workflows/${workflow1[0].id}/edit`);
    console.log(`   http://localhost:3000/developer/workflows/${workflow2[0].id}/edit`);
    console.log(`   http://localhost:3000/developer/workflows/${workflow3[0].id}/edit`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedDatabase();