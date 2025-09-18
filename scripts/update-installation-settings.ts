#!/usr/bin/env tsx

import { db } from "../src/core/database";
import { installations } from "../src/core/database/schemas";
import { eq } from "drizzle-orm";

async function updateInstallationSettings() {
  try {
    console.log("Updating installation settings...");

    // Update the existing analytics installation to enable embed mode
    const result = await db
      .update(installations)
      .set({
        settings: {
          embedMode: true
        }
      })
      .where(eq(installations.appId, "com.nexusvite.analytics"));

    console.log("✓ Successfully updated installation settings");

  } catch (error) {
    console.error("Error updating installation settings:", error);
    process.exit(1);
  }

  process.exit(0);
}

updateInstallationSettings();