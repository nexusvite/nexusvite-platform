import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";

export async function POST(request: NextRequest) {
  try {
    const { appId, accessToken } = await request.json();

    if (!appId || !accessToken) {
      return NextResponse.json(
        { error: "Missing appId or accessToken" },
        { status: 400 }
      );
    }

    // For demo, extract user info from token (in production, verify JWT)
    // Simple token format: "access_user_{userId}_{timestamp}"
    const tokenParts = accessToken.split("_");
    const userId = tokenParts[2] || "user_1";

    // Check if app is installed for this user
    const installedApps = await AppRegistry.getInstalledApps(userId);
    const isInstalled = installedApps.some(app => app.appId === appId);

    return NextResponse.json({
      installed: isInstalled,
      userId,
      appId,
    });
  } catch (error) {
    console.error("Error verifying app installation:", error);
    return NextResponse.json(
      { error: "Failed to verify app installation" },
      { status: 500 }
    );
  }
}