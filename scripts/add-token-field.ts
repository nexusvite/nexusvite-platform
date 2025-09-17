#!/usr/bin/env tsx

import { sql } from "drizzle-orm";
import { db } from "../src/core/database";

async function addTokenField() {
  try {
    console.log("Adding token field to session table...");

    // Add the token column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE session
      ADD COLUMN IF NOT EXISTS token TEXT UNIQUE
    `);

    console.log("✓ Successfully added token field to session table");

  } catch (error) {
    console.error("Error adding token field:", error);
    process.exit(1);
  }

  process.exit(0);
}

addTokenField();