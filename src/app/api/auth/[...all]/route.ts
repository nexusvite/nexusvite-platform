import { NextRequest, NextResponse } from "next/server";

// Simplified auth handler for now
// TODO: Integrate Better Auth properly once configuration is fixed

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle session check
  if (request.url.includes("get-session")) {
    return NextResponse.json({
      user: null,
      session: null
    });
  }

  return NextResponse.json({
    message: "Auth endpoint",
    action
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle login
    if (request.url.includes("login")) {
      // Simple mock login for demo
      if (body.email === "admin@nexusvite.com" && body.password === "admin123") {
        return NextResponse.json({
          user: {
            id: "1",
            email: "admin@nexusvite.com",
            name: "Admin User",
            role: "admin"
          },
          token: "mock-jwt-token"
        });
      }

      return NextResponse.json({
        error: "Invalid credentials"
      }, { status: 401 });
    }

    // Handle register
    if (request.url.includes("register")) {
      return NextResponse.json({
        user: {
          id: "2",
          email: body.email,
          name: body.name,
          role: "user"
        },
        message: "Registration successful"
      });
    }

    return NextResponse.json({
      message: "Auth endpoint",
      body
    });
  } catch (error) {
    return NextResponse.json({
      error: "Invalid request"
    }, { status: 400 });
  }
}