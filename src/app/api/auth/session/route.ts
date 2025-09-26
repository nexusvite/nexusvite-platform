import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    const response = NextResponse.json({
      user: session?.user || null,
      session: session ? { token: session.session?.token } : null,
    });

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "http://localhost:3001");
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
  } catch (error) {
    console.error("Error getting session:", error);

    const response = NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );

    // Add CORS headers even for error responses
    response.headers.set("Access-Control-Allow-Origin", "http://localhost:3001");
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
  }
}