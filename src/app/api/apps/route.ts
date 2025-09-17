import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";

// GET /api/apps - Get all available apps or user's installed apps
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const installed = searchParams.get("installed");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    // For demo, use a mock user ID
    const userId = "user_1";

    if (installed === "true") {
      // Get user's installed apps
      const apps = await AppRegistry.getInstalledApps(userId);
      return NextResponse.json({ apps });
    } else if (category) {
      // Get apps by category
      const apps = await AppRegistry.getAppsByCategory(category);
      return NextResponse.json({ apps });
    } else if (search) {
      // Search apps
      const apps = await AppRegistry.searchApps(search);
      return NextResponse.json({ apps });
    } else {
      // Get all available apps
      const apps = await AppRegistry.getAvailableApps();
      return NextResponse.json({ apps });
    }
  } catch (error) {
    console.error("Error fetching apps:", error);
    return NextResponse.json(
      { error: "Failed to fetch apps" },
      { status: 500 }
    );
  }
}

// POST /api/apps - Install an app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, userId: providedUserId } = body;

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    // Use provided userId or default for demo
    const userId = providedUserId || "user_1";
    const organizationId = "org_1";

    const installation = await AppRegistry.installApp(appId, userId, organizationId);
    return NextResponse.json({ installation });
  } catch (error: any) {
    console.error("Error installing app:", error);

    // Return 409 if app is already installed
    if (error.message && error.message.includes("already installed")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to install app" },
      { status: 400 }
    );
  }
}