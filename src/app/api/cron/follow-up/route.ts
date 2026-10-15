import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildEmailBody, getResend, getResendFrom } from "@/lib/email";
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

async function processDueFollowUps() {
  const pending = await db.application.findMany({
    where: {
      followUpSent: false,
      followUpDate: { not: null, lte: new Date() },
      status: { not: "bounced" },
    },
    include: {
      user: {
        select: {
          name: true,
          portfolio: true,
          resumeUrl: true,
        },
      },
    },
    orderBy: { followUpDate: "asc" },
    take: 25,
  });

  let succeeded = 0;
  let failed = 0;
  await Promise.allSettled(
    pending.map(async (application) => {
      try {
        if (!application.companyEmail) throw new Error("Missing recipient email");
        const template = `Hi {{recruiter_name}},

I hope you're doing well.

Just wanted to follow up on my application for the {{role}} position at {{company}}.

I'm still very interested in the opportunity and would love to hear if there are any updates regarding my application.

For convenience, here's my portfolio again:
{{portfolio}}

Thank you for your time, and I look forward to hearing from you.

Best regards,
{{name}}
`;
        const html = buildEmailBody(template, {
          role: application.role,
          company: application.company,
          recruiterName: application.recruiterName,
          portfolio: application.user.portfolio,
          resumeUrl: application.user.resumeUrl,
          name: application.user.name,
        });
        const { error } = await getResend().emails.send({
          from: getResendFrom(),
          to: application.companyEmail,
          subject: `Following up: ${application.subject}`,
          html,
        });
        if (error) throw new Error(error.message);

        await db.application.update({
          where: { id: application.id },
          data: { followUpSent: true },
        });
        succeeded++;
      } catch (error) {
        failed++;
        console.error("Follow up failed", { applicationId: application.id, error });
      }
    }),
  );
  return { processed: pending.length, succeeded, failed };
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

  let followUps: Awaited<ReturnType<typeof processDueFollowUps>>;
  try {
    followUps = await processDueFollowUps();
  } catch (error) {
    console.error("[Cron] Follow-up processing failed.", error);
    followUps = { processed: 0, succeeded: 0, failed: 1 };
  }

  try {
    const outreach = await processDailyOutreach();
    return NextResponse.json({ followUps, outreach });
  } catch (error) {
    console.error("[Cron] Daily outreach processing failed.", error);
    return NextResponse.json(
      { followUps, error: "Daily outreach processing failed." },
      { status: 500 },
    );
  }
}
