#!/usr/bin/env tsx

import { sql } from "drizzle-orm";
import { db } from "../src/core/database";

async function addPasswordField() {
  try {
    console.log("Adding password field to users table...");

    // Try to add the password column (will do nothing if it already exists)
    try {
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password TEXT
      `);
      console.log("✓ Successfully added password field to users table (or already exists)");
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        console.log("✓ Password field already exists in users table");
      } else {
        throw err;
      }
    }

    // Update other columns with their defaults
    await db.execute(sql`
      ALTER TABLE oauth_providers ALTER COLUMN scopes SET DEFAULT '[]'
    `);

    await db.execute(sql`
      ALTER TABLE apps ALTER COLUMN permissions SET DEFAULT '[]'
    `);

    await db.execute(sql`
      ALTER TABLE api_routes ALTER COLUMN middleware SET DEFAULT '[]'
    `);

    await db.execute(sql`
      ALTER TABLE installations ALTER COLUMN settings SET DEFAULT '{}'
    `);

    console.log("✓ Successfully updated all table defaults");

  } catch (error) {
    console.error("Error adding password field:", error);
    process.exit(1);
  }

  process.exit(0);
}

addPasswordField();