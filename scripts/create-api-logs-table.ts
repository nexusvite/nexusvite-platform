#!/usr/bin/env tsx

import { sql } from "drizzle-orm";
import { db } from "../src/core/database";

async function createApiLogsTable() {
  try {
    console.log("Creating api_logs table...");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        app_id TEXT REFERENCES apps(id) ON DELETE SET NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        response_time INTEGER,
        request_body JSONB,
        response_body JSONB,
        ip_address TEXT,
        user_agent TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("✓ Successfully created api_logs table");

    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp);
    `);

    console.log("✓ Successfully created indexes");

  } catch (error) {
    console.error("Error creating api_logs table:", error);
    process.exit(1);
  }

  process.exit(0);
}

createApiLogsTable();