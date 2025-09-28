import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/core/database";
import { config } from "@/core/config";
import * as betterAuthSchema from "@/core/database/schemas/better-auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: betterAuthSchema,
  }),

  baseURL: config.auth.baseUrl || "http://localhost:6100",
  secret: config.auth.secret,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  socialProviders: {
    google: {
      clientId: config.auth.providers.google.clientId,
      clientSecret: config.auth.providers.google.clientSecret,
      redirectURI: `${config.auth.baseUrl}/api/auth/callback/google`,
    },
    github: {
      clientId: config.auth.providers.github.clientId,
      clientSecret: config.auth.providers.github.clientSecret,
      redirectURI: `${config.auth.baseUrl}/api/auth/callback/github`,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },


  advanced: {
    database: {
      generateId: () => {
        // Using the same ID generation as our schema
        return createId();
      },
    },
  },

  trustedOrigins: config.isDevelopment
    ? ["http://localhost:3000"]
    : [config.app.url],

  onRequest: async ({ request, headers, context }) => {
    return {
      request,
      headers,
      context,
    };
  },

  onResponse: async ({ response, request, context }) => {
    // Broadcast auth events via WebSocket
    if (response.status === 200) {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Handle login/signup success
      if (pathname.includes("/sign-in") || pathname.includes("/sign-up")) {
        const io = (global as any).io;
        if (io && context?.user) {
          io.to(`user:${context.user.id}`).emit("auth:login", {
            userId: context.user.id,
            timestamp: Date.now(),
          });
        }
      }

      // Handle logout
      if (pathname.includes("/sign-out")) {
        const io = (global as any).io;
        if (io && context?.user) {
          io.to(`user:${context.user.id}`).emit("auth:logout", {
            userId: context.user.id,
            timestamp: Date.now(),
          });
        }
      }
    }

    return response;
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;