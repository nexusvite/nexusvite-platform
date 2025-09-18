import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";

// GET /api/apps/[installationId] - Get installation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ installationId: string }> }
) {
  try {
    const { installationId } = await params;

    if (!installationId) {
      return NextResponse.json(
        { error: "Installation ID is required" },
        { status: 400 }
      );
    }

    // TODO: Get actual user ID from session
    const userId = "glr5k48b47k5ybhqav0v3nit"; // test@example.com user

    const installation = await AppRegistry.getInstallation(installationId, userId);

    if (!installation) {
      return NextResponse.json(
        { error: "Installation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(installation);
  } catch (error: unknown) {
    console.error("Error fetching installation:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch installation" },
      { status: 500 }
    );
  }
}

// DELETE /api/apps/[installationId] - Uninstall an app
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ installationId: string }> }
) {
  try {
    const { installationId } = await params;

    if (!installationId) {
      return NextResponse.json(
        { error: "Installation ID is required" },
        { status: 400 }
      );
    }

    // TODO: Get actual user ID from session
    const userId = "glr5k48b47k5ybhqav0v3nit"; // test@example.com user

    // Uninstall the app (this will also send webhook)
    await AppRegistry.uninstallApp(installationId, userId);

    return NextResponse.json({
      success: true,
      message: "App uninstalled successfully"
    });
  } catch (error: unknown) {
    console.error("Error uninstalling app:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to uninstall app" },
      { status: 400 }
    );
  }
}