#!/usr/bin/env tsx

import { sql } from "drizzle-orm";
import { db } from "../src/core/database";

async function checkSessions() {
  try {
    console.log("Checking sessions...");
    const sessions = await db.execute(sql`SELECT * FROM session`);
    console.log("Sessions:", sessions);

  } catch (error) {
    console.error("Error checking sessions:", error);
    process.exit(1);
  }

  process.exit(0);
}

checkSessions();