import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";
import { auth } from "@/core/auth/config";

export async function POST(request: NextRequest) {
  try {
    const { appId, accessToken } = await request.json();

    if (!appId || !accessToken) {
      return NextResponse.json(
        { error: "Missing appId or accessToken" },
        { status: 400 }
      );
    }

    // Verify the access token with better-auth
    // The accessToken should be a valid session token from the platform
    let session;
    try {
      // Verify session using the provided access token
      session = await auth.api.getSession({
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: "Invalid or expired access token" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if app is installed for this user
    const installedApps = await AppRegistry.getInstalledApps(userId);
    const isInstalled = installedApps.some(app => app.appId === appId);

    return NextResponse.json({
      installed: isInstalled,
      userId,
      appId,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    });
  } catch (error) {
    console.error("Error verifying app installation:", error);
    return NextResponse.json(
      { error: "Failed to verify app installation" },
      { status: 500 }
    );
  }
}