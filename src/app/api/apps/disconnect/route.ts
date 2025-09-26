import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";
import { getSession } from "@/core/auth/session";

// POST /api/apps/disconnect - App notifies platform it has been disconnected
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Find and remove the installation
    const installedApps = await AppRegistry.getInstalledApps(userId);
    const installation = installedApps.find(app => app.appId === appId);

    if (installation) {
      await AppRegistry.uninstallApp(installation.id, userId);

      // Broadcast app uninstallation event via WebSocket
      const io = (global as any).io;
      if (io) {
        io.to(`user:${userId}`).emit("auth:app-uninstalled", {
          userId,
          installationId: installation.id,
          appId,
          timestamp: Date.now(),
        });
      }

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