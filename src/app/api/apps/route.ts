import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";

// GET /api/apps - Get all available apps or user's installed apps
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const installed = searchParams.get("installed");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    // TODO: Get actual user ID from session
    const userId = "glr5k48b47k5ybhqav0v3nit"; // test@example.com user

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
      const apps = await AppRegistry.getAllApps();
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

    // Use provided userId or default
    const userId = providedUserId || "glr5k48b47k5ybhqav0v3nit"; // test@example.com user

    const installation = await AppRegistry.installApp(appId, userId);

    // If the app has OAuth authentication, initiate the OAuth flow
    const app = await AppRegistry.getAppById(appId);
    if (app?.authentication?.type === 'oauth2') {
      // Build OAuth URL with installation details
      const authUrl = new URL(`${app.homepage}/api/auth/connect`);
      authUrl.searchParams.set('installation_id', installation.id);
      authUrl.searchParams.set('platform_url', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      authUrl.searchParams.set('embed_mode', String(installation.settings?.embedMode || true));
      authUrl.searchParams.set('user_id', userId);

      return NextResponse.json({
        installation,
        requiresAuth: true,
        authUrl: authUrl.toString()
      });
    }

    return NextResponse.json({ installation });
  } catch (error: unknown) {
    console.error("Error installing app:", error);

    // Return 409 if app is already installed
    if (error instanceof Error && error.message.includes("already installed")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to install app" },
      { status: 400 }
    );
  }
}