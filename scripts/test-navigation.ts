#!/usr/bin/env tsx

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { AppRegistry } from "../src/lib/app-registry";

async function testNavigation() {
  try {
    console.log("Testing AppRegistry.getAppById...\n");
    
    const app = await AppRegistry.getAppById("com.nexusvite.analytics");
    console.log("Navigation in getAppById result:", app?.navigation ? "YES" : "NO");
    if (app?.navigation) {
      console.log("Navigation items:", JSON.stringify(app.navigation, null, 2));
    } else {
      console.log("Full app manifest:");
      console.log(JSON.stringify(app, null, 2));
    }

  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

testNavigation();
