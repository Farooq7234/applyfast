"use server";

import { getResend } from "@/lib/email";
import { requireSession } from "@/lib/session";
import type { ResendUsage, ResendUsageResult } from "@/types";

const CACHE_TTL_MS = 60_000;

let cache: { result: ResendUsageResult; expiresAt: number } | null = null;
let inFlight: Promise<ResendUsageResult> | null = null;

export async function getResendUsage(force = false): Promise<ResendUsageResult> {
  await requireSession();

  if (!force && cache && cache.expiresAt > Date.now()) {
    return cache.result;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = fetchResendUsage();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

async function fetchResendUsage(): Promise<ResendUsageResult> {
  const fetchedAt = new Date().toISOString();

  try {
    const { data, error } = await getResend().usage.get();

    if (error) {
      const message =
        error.name === "restricted_api_key"
          ? "The Resend API key needs full access to read account usage."
          : error.message || "Resend could not return account usage.";

      const result: ResendUsageResult = { usage: null, error: message, fetchedAt };
      cache = { result, expiresAt: Date.now() + CACHE_TTL_MS };
      return result;
    }

    const result: ResendUsageResult = {
      usage: data as ResendUsage,
      error: null,
      fetchedAt,
    };
    cache = { result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  } catch (error) {
    console.error("[Resend] usage.get failed:", error);

    const result: ResendUsageResult = {
      usage: null,
      error: "Could not load Resend usage. Check the API key and try again.",
      fetchedAt,
    };
    cache = { result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  }
}
