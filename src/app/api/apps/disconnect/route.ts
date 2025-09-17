import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";

// POST /api/apps/disconnect - App notifies platform it has been disconnected
export async function POST(request: NextRequest) {
  try {
    const { appId, userId: providedUserId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    // Use provided userId or default for demo
    const userId = providedUserId || "user_1";

    // Find and remove the installation
    const installedApps = await AppRegistry.getInstalledApps(userId);
    const installation = installedApps.find(app => app.appId === appId);

    if (installation) {
      await AppRegistry.uninstallApp(installation.id, userId);

      return NextResponse.json({
        success: true,
        message: "App disconnected and uninstalled from platform"
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "App was not installed"
      });
    }
  } catch (error: unknown) {
    console.error("Error disconnecting app:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect app" },
      { status: 500 }
    );
  }
}