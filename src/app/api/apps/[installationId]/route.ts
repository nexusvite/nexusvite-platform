import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";

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

    // For demo, use a mock user ID
    const userId = "user_1";

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