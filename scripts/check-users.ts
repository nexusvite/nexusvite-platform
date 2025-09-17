#!/usr/bin/env tsx

import { sql } from "drizzle-orm";
import { db } from "../src/core/database";

async function checkUsers() {
  try {
    console.log("Checking Better Auth user table...");

    const betterAuthUsers = await db.execute(sql`SELECT * FROM "user"`);
    console.log("Better Auth users:", betterAuthUsers);

    console.log("\nChecking original users table...");
    const originalUsers = await db.execute(sql`SELECT id, email, name FROM users`);
    console.log("Original users:", originalUsers);

    console.log("\nChecking accounts table...");
    const accounts = await db.execute(sql`SELECT * FROM account`);
    console.log("Accounts:", accounts);

  } catch (error) {
    console.error("Error checking users:", error);
    process.exit(1);
  }

  process.exit(0);
}

checkUsers();