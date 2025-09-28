import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:6100"
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useUser,
  user,
  session
} = authClient;