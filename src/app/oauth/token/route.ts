import { NextRequest, NextResponse } from "next/server";

// Token exchange endpoint for OAuth flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grant_type, code, refresh_token, client_id, client_secret, redirect_uri } = body;

    // Handle authorization code exchange
    if (grant_type === "authorization_code") {
      if (!code) {
        return NextResponse.json(
          { error: "invalid_request", error_description: "Missing authorization code" },
          { status: 400 }
        );
      }

      // In a real implementation, verify the code against stored codes
      // For demo, we'll generate tokens
      const accessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return NextResponse.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: "read:users read:organizations read:apps read:transactions",
        user: {
          id: "user_1",
          email: "admin@nexusvite.com",
          name: "Admin User",
          role: "admin",
          organizationId: "org_1"
        }
      });
    }

    // Handle refresh token
    if (grant_type === "refresh_token") {
      if (!refresh_token) {
        return NextResponse.json(
          { error: "invalid_request", error_description: "Missing refresh token" },
          { status: 400 }
        );
      }

      // Generate new access token
      const accessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return NextResponse.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refresh_token, // Return same refresh token
        scope: "read:users read:organizations read:apps read:transactions"
      });
    }

    return NextResponse.json(
      { error: "unsupported_grant_type", error_description: "Grant type not supported" },
      { status: 400 }
    );
  } catch (error) {
    console.error("OAuth token error:", error);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500 }
    );
  }
}