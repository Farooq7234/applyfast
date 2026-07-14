import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildEmailBody, getResend } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";

    if (
      !isVercelCron &&
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await db.application.findMany({
      where: {
        followUpSent: false,
        followUpDate: { not: null, lte: new Date() },
        status: {
      not: "bounced",
    }
      },
      include: { user: true },
      orderBy: { followUpDate: "asc" },
      take: 25,
    });

    if (pending.length === 0) {
      return NextResponse.json({ processed: 0, succeeded: 0, failed: 0, message: "No follow ups due." });
    }

    let succeeded = 0;
    let failed = 0;

    await Promise.allSettled(
      pending.map(async (app:any) => {
        try {
          if (!app.companyEmail) throw new Error("Missing recipient email");

          const template = `Hi {{recruiter_name}},

I hope you are doing well.

I wanted to briefly follow up regarding my application for the {{role}} position at {{company}}.

I remain genuinely interested in the opportunity and would be happy to provide any additional information if helpful.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,

{{name}}
{{email}}
{{portfolio}}
`;

          const html = buildEmailBody(template, {
            role: app.role,
            company: app.company,
            recruiterName: app.recruiterName,
            portfolio: app.user.portfolio,
            resumeUrl: app.user.resumeUrl,
            name: app.user.name,
          });

          await getResend().emails.send({
            from: "Umar Farooq <contact@farooqx.in>",
            to: app.companyEmail,
            subject: `Following up: ${app.subject}`,
            html,
          });

          await db.application.update({
            where: { id: app.id },
            data: { followUpSent: true },
          });

          succeeded++;
        } catch (error) {
          failed++;
          console.error("Follow up failed", { applicationId: app.id, error });
        }
      })
    );

    return NextResponse.json({ processed: pending.length, succeeded, failed });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
