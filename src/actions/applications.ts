"use server";

import { db } from "@/lib/db";
import { applicationSchema } from "@/lib/validations";
import { requireSession } from "@/lib/session";
import { buildEmailBody, buildEmailSubject, getResend } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function createApplication(data: unknown) {
  const session = await requireSession();
  const parsed = applicationSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { company, companyEmail, role, recruiterName, templateId } = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (!user.resumeUrl) return { error: "Please add your resume URL in your profile first" };

  // Resolve template
  let templateSubject: string;
  let templateBody: string;

  if (templateId) {
    const template = await db.template.findUnique({ where: { id: templateId } });
    if (!template) return { error: "Template not found" };
    templateSubject = template.subject;
    templateBody = template.body;
  } else {
    const defaultTemplate = await db.template.findFirst({
      where: { userId: session.user.id, isDefault: true },
    });
    if (!defaultTemplate) return { error: "No default template found" };
    templateSubject = defaultTemplate.subject;
    templateBody = defaultTemplate.body;
  }

  const vars = {
    role,
    company,
    recruiterName,
    portfolio: user.portfolio,
    resumeUrl: user.resumeUrl,
    name: user.name,
  };

  const subject = buildEmailSubject(templateSubject, role, company);
 const html = buildEmailBody(templateBody, vars);

  const {data:sendData, error: sendError } = await getResend().emails.send({
    from: "Umar Farooq <contact@farooqx.in>",
    to: companyEmail,
    subject,
    html,
  });

  if (sendError) {
    console.error("[Resend] send failed:", sendError);
    await db.application.create({
      data: {
        userId: session.user.id,
        company,
        companyEmail,
        role,
        recruiterName: recruiterName || null,
        subject,
        body: html,
        status: "failed",       
        followUpDate: null,
      },
    });
    return { error: `Email delivery failed: ${sendError.message}` };
  }

  const application = await db.application.create({
    data: {
      userId: session.user.id,
      company,
      companyEmail,
      role,
      recruiterName: recruiterName || null,
      subject,
      body: html,
      resendEmailId: sendData?.id || null,
      status: "sent",
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard");
  return { success: true, applicationId: application.id };
}

export async function getApplications(search?: string, page = 1, pageSize = 15) {
  const session = await requireSession();

  const where = {
    userId: session.user.id,
    ...(search
      ? {
          OR: [
            { company: { contains: search, mode: "insensitive" as const } },
            { role: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [applications, total] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.application.count({ where }),
  ]);

  return { applications, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getApplication(id: string) {
  const session = await requireSession();
  return db.application.findFirst({
    where: { id, userId: session.user.id },
  });
}

export async function resendApplication(id: string): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  const application = await db.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!application) return { error: "Application not found" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  const {data:sendData, error: sendError } = await getResend().emails.send({
    from: "Umar Farooq <contact@farooqx.in>",
    to: application.companyEmail,
    subject: application.subject,
    html: application.body,
  });

  if (sendError) {
    console.error("[Resend] resend failed:", sendError);
    return { error: `Email delivery failed: ${sendError.message}` };
  }

  await db.application.update({
    where: { id },
    data: { status: "sent", createdAt: new Date() , resendEmailId: sendData?.id ?? null,},
  });

  revalidatePath("/dashboard/applications");
  return { success: true };
}

export async function deleteApplication(id: string): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  await db.application.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getDashboardStats() {
  const session = await requireSession();
  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [total, sentToday, failed, pendingFollowUps] = await Promise.all([
    db.application.count({ where: { userId } }),
    db.application.count({
      where: { userId, status: "sent", createdAt: { gte: today, lt: tomorrow } },
    }),
    db.application.count({ where: { userId, status: "failed" } }),
    db.application.count({
      where: {
        userId,
        followUpSent: false,
        followUpDate: { lte: new Date() },
        status: "sent",
      },
    }),
  ]);

  return { total, sentToday, failed, pendingFollowUps };
}
