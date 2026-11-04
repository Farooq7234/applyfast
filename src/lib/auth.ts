import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

function normalizeUrl(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : undefined;
}

function resolveBaseURL() {
  const configured = normalizeUrl(process.env.BETTER_AUTH_URL);
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost =
    configured !== undefined &&
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(configured);

  if (configured && !(isProduction && isLocalhost)) {
    return configured;
  }

  const vercelHost = normalizeUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL,
  );
  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  return isProduction ? undefined : configured;
}

const baseURL = resolveBaseURL();

const trustedOrigins = [
  baseURL,
  normalizeUrl(process.env.NEXT_PUBLIC_APP_URL),
  normalizeUrl(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ),
  normalizeUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ),
  "http://localhost:3000",
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  database: prismaAdapter(db as Parameters<typeof prismaAdapter>[0], {
    provider: "postgresql",
  }),
  baseURL,
  trustedOrigins,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: "offline",
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // refresh daily
    cookieCache:{
      enabled:true,
      maxAge: 60
    }
  },
  
  secret: process.env.BETTER_AUTH_SECRET!,
});

