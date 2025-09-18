import { NextRequest, NextResponse } from "next/server";
import { AppRegistry } from "@/lib/app-registry";

export async function PUT(
  req: NextRequest,
  { params }: { params: { installationId: string } }
) {
  try {
    const { embedMode } = await req.json();

    // TODO: Get actual user ID from session
    const userId = "glr5k48b47k5ybhqav0v3nit"; // test@example.com user

    // Update the app settings
    const updatedInstallation = await AppRegistry.updateAppSettings(
      params.installationId,
      userId,
      { embedMode }
    );

    return NextResponse.json({
      success: true,
      settings: updatedInstallation.settings,
    });
  } catch (error: any) {
    console.error("Settings update error:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json(
        { error: "App not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}