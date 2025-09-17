#!/usr/bin/env tsx

import { db } from "../src/core/database";
import { users } from "../src/core/database/schemas";

async function syncUser() {
  try {
    console.log("Syncing Better Auth user to users table...");

    // Add the Better Auth user to the main users table
    await db.insert(users).values({
      id: "glr5k48b47k5ybhqav0v3nit",
      email: "test@example.com",
      name: "Test User",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();

    console.log("✓ Successfully synced user");

  } catch (error) {
    console.error("Error syncing user:", error);
    process.exit(1);
  }

  process.exit(0);
}

syncUser();