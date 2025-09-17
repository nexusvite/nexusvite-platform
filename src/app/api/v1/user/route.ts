import { NextRequest, NextResponse } from "next/server";

// User info endpoint for OAuth apps
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Missing or invalid authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  // In production, validate the token
  // For demo, return mock user data
  if (token.startsWith("access_")) {
    return NextResponse.json({
      id: "user_1",
      email: "admin@nexusvite.com",
      name: "Admin User",
      role: "admin",
      organizationId: "org_1",
      avatar: null,
      createdAt: new Date().toISOString(),
      metadata: {
        plan: "pro",
        verified: true
      }
    });
  }

  return NextResponse.json(
    { error: "Invalid token" },
    { status: 401 }
  );
}