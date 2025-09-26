import { auth } from "@/core/auth/config";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function getSession(request?: NextRequest) {
  const session = await auth.api.getSession({
    headers: request ? Object.fromEntries(request.headers.entries()) : await headers(),
  });

  return session;
}

export async function requireAuth(request?: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

export async function getUserId(request?: NextRequest) {
  const session = await requireAuth(request);
  return session.user.id;
}