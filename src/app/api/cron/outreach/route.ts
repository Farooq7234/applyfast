import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processDailyOutreach } from "@/lib/outreach-service";

export const runtime = "nodejs";
export const maxDuration = 300;

function hasValidCronAuthorization(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Cron authentication is not configured." },
      { status: 503 },
    );
  }
  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const outreach = await processDailyOutreach();
    return NextResponse.json({ outreach });
  } catch (error) {
    console.error("[Cron] Daily outreach processing failed.", error);
    return NextResponse.json(
      { error: "Daily outreach processing failed." },
      { status: 500 },
    );
  }
}
