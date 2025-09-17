import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/core/database";
import { config } from "@/core/config";
import * as schema from "@/core/database/schemas";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verificationToken: schema.verificationTokens,
    },
  }),

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

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
    },
  },

  advanced: {
    generateId: () => {
      // Using the same ID generation as our schema
      const { createId } = require('@paralleldrive/cuid2');
      return createId();
    },
  },

  trustedOrigins: config.isDevelopment
    ? ["http://localhost:3000"]
    : [config.app.url],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;