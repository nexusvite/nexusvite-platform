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

  baseURL: config.auth.baseUrl || "http://localhost:3000",
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
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;