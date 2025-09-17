#!/usr/bin/env tsx

import { sql } from "drizzle-orm";
import { db } from "../src/core/database";

async function checkInstallations() {
  try {
    console.log("Checking installations...");
    const installations = await db.execute(sql`SELECT * FROM installations`);
    console.log("Installations:", installations);

    console.log("\nChecking apps...");
    const apps = await db.execute(sql`SELECT id, name, status FROM apps`);
    console.log("Apps:", apps);

  } catch (error) {
    console.error("Error checking installations:", error);
    process.exit(1);
  }

  process.exit(0);
}

checkInstallations();