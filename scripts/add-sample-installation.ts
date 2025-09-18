#!/usr/bin/env tsx

import { db } from "../src/core/database";
import { installations } from "../src/core/database/schemas";
import { createId } from "@paralleldrive/cuid2";

async function addSampleInstallation() {
  try {
    console.log("Adding sample installation...");

    // Add a sample installation for the test user
    await db.insert(installations).values({
      id: createId(),
      userId: "glr5k48b47k5ybhqav0v3nit", // test@example.com user
      appId: "com.nexusvite.analytics",
      status: "active",
      installedAt: new Date(),
      settings: {
        embedMode: true // Enable embedded mode by default
      }
    });

    console.log("✓ Successfully added sample installation");

  } catch (error) {
    console.error("Error adding installation:", error);
    process.exit(1);
  }

  process.exit(0);
}

addSampleInstallation();