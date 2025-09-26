import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";
import { getSession } from "@/core/auth/session";

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:3001",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

// GET /api/apps - Get all available apps or user's installed apps
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const installed = searchParams.get("installed");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    // Get user session (optional for browsing, required for installed apps)
    const session = await getSession(request);

    if (installed === "true") {
      // Require authentication for viewing installed apps
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required to view installed apps" },
          { status: 401 }
        );
      }

      const userId = session.user.id;
      const apps = await AppRegistry.getInstalledApps(userId);
      const response = NextResponse.json({ apps });
      response.headers.set("Access-Control-Allow-Origin", "http://localhost:3001");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      return response;
    } else if (category) {
      // Get apps by category (public)
      const apps = await AppRegistry.getAppsByCategory(category);
      return NextResponse.json({ apps });
    } else if (search) {
      // Search apps (public)
      const apps = await AppRegistry.searchApps(search);
      return NextResponse.json({ apps });
    } else {
      // Get all available apps (public)
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
    // Require authentication for installing apps
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to install apps" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appId } = body;

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    // Use authenticated user's ID
    const userId = session.user.id;

    const installation = await AppRegistry.installApp(appId, userId);

    // Broadcast app installation event via WebSocket
    const io = (global as any).io;
    if (io) {
      io.to(`user:${userId}`).emit("auth:app-installed", {
        userId,
        installationId: installation.id,
        appId,
        timestamp: Date.now(),
      });
    }

    // If the app has OAuth authentication, initiate the OAuth flow
    const app = await AppRegistry.getAppById(appId);
    if (app?.authentication?.type === 'oauth2') {
      // Generate a secure session token for the app to verify
      // In production, this should be a signed JWT or similar
      const sessionToken = session.session?.token || '';

      // Build OAuth URL with installation details
      const authUrl = new URL(`${app.homepage}/api/auth/connect`);
      authUrl.searchParams.set('installation_id', installation.id);
      authUrl.searchParams.set('platform_url', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      authUrl.searchParams.set('embed_mode', String(installation.settings?.embedMode || true));
      // Do NOT pass user_id directly - the app should verify the session token instead
      authUrl.searchParams.set('session_token', sessionToken);

      return NextResponse.json({
        installation,
        requiresAuth: true,
        authUrl: authUrl.toString(),
        // Include session info for the client to use
        session: {
          userId: session.user.id,
          email: session.user.email,
        }
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