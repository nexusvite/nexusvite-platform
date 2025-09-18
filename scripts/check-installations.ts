#!/usr/bin/env tsx

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/core/database";
import { installations } from "../src/core/database/schemas/installations";
import { apps } from "../src/core/database/schemas/apps";
import { eq } from "drizzle-orm";

async function checkInstallations() {
  try {
    console.log("Checking installations...\n");

    // Get all installations
    const allInstallations = await db.select().from(installations);
    console.log("Installations in database:");
    console.log(JSON.stringify(allInstallations, null, 2));
    console.log("\n");

    // Get analytics app
    const analyticsApp = await db.select().from(apps).where(eq(apps.id, "com.nexusvite.analytics"));
    console.log("Analytics app manifest:");
    console.log(JSON.stringify(analyticsApp[0]?.manifest, null, 2));
    console.log("\n");

    // Check if analytics app has navigation
    if (analyticsApp[0]?.manifest) {
      const manifest = analyticsApp[0].manifest as any;
      console.log("Navigation in manifest:", manifest.navigation ? "YES" : "NO");
      if (manifest.navigation) {
        console.log("Navigation items:", JSON.stringify(manifest.navigation, null, 2));
      }
    }

  } catch (error) {
    console.error("Error checking installations:", error);
    process.exit(1);
  }

  process.exit(0);
}

checkInstallations();
