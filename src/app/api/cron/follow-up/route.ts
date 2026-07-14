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

I hope you're doing well.

I wanted to follow up on my application for the {{role}} position at {{company}}. I know you're likely reviewing many applications, so I just wanted to reiterate my interest in the opportunity.

I'm genuinely excited about the possibility of contributing to your team. I build modern web applications using React, Next.js, TypeScript, Node.js, and PostgreSQL, and I'd love the chance to bring those skills to {{company}}.

In case it's helpful, here's my portfolio again:

Portfolio: {{portfolio}}

If there's any additional information I can provide, I'd be happy to share it.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,

{{name}}
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
