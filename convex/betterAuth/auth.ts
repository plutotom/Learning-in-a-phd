import { betterAuth } from "better-auth";
import { createClient, convexAdapter } from "@convex-dev/better-auth";
import { components } from "../_generated/api";
import type { GenericCtx } from "@convex-dev/better-auth";

export const authComponent = createClient(components.betterAuth);

export const createAuth = (ctx: GenericCtx) =>
  betterAuth({
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    trustedOrigins: [process.env.SITE_URL ?? "http://localhost:5123"],
  });
