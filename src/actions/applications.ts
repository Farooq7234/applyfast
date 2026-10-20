"use server";

import { db } from "@/lib/db";
import {
  applicationSchema,
  batchApplicationSchema,
  requiredScheduledAtSchema,
} from "@/lib/validations";
import { requireSession } from "@/lib/session";
import { getResend, getResendFrom } from "@/lib/email";
import { buildTemplateVariables, renderTemplate } from "@/lib/template-variables";
import { getUserTemplate } from "@/lib/resend-templates";
import { revalidatePath } from "next/cache";

export async function createApplication(data: unknown) {
  const session = await requireSession();
  const parsed = applicationSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { company, companyEmail, role, recruiterName, templateId, scheduledAt } =
    parsed.data;

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (!user.resumeUrl) return { error: "Please add your resume URL in your profile first" };

  // Resolve the user's Resend template
  const template = await getUserTemplate(session.user.id, templateId);
  if (!template) {
    return {
      error: "Create a template in Templates before sending an application.",
    };
  }

  const variables = buildTemplateVariables({
    role,
    company,
    recruiterName,
    portfolio: user.portfolio,
    linkedin: user.linkedin,
    github: user.github,
    phone: user.phone,
    resumeUrl: user.resumeUrl,
    projectUrl1: user.projectUrl1,
    projectUrl2: user.projectUrl2,
    projectUrl3: user.projectUrl3,
    name: user.name,
  });

  const subject = renderTemplate(template.subject ?? "", variables);
  const html = renderTemplate(template.html, variables);

  const {data:sendData, error: sendError } = await getResend().emails.send({
    from: getResendFrom(),
    to: companyEmail,
    subject,
    template: { id: template.id, variables },
    ...(scheduledDate ? { scheduledAt: scheduledDate.toISOString() } : {}),
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
      status: scheduledDate ? "scheduled" : "sent",
      scheduledAt: scheduledDate,
      sentAt: scheduledDate ? null : new Date(),
    },
  });

  revalidatePath("/applications");
  revalidatePath("/");
  return {
    success: true,
    applicationId: application.id,
    scheduledAt: scheduledDate?.toISOString() ?? null,
  };
}

export async function createApplicationsBatch(data: unknown) {
  const session = await requireSession();
  const parsed = batchApplicationSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { company, role, recipients, templateId, requestId, scheduledAt } =
    parsed.data;
  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (!user.resumeUrl) {
    return { error: "Please add your resume URL in your profile first" };
  }

  const template = await getUserTemplate(session.user.id, templateId);
  if (!template) {
    return {
      error: "Create a template in Templates before sending applications.",
    };
  }

  const renderedEmails = recipients.map((recipient) => {
    const variables = buildTemplateVariables({
      role,
      company,
      recruiterName: recipient.recruiterName,
      portfolio: user.portfolio,
      linkedin: user.linkedin,
      github: user.github,
      phone: user.phone,
      resumeUrl: user.resumeUrl,
      projectUrl1: user.projectUrl1,
      projectUrl2: user.projectUrl2,
      projectUrl3: user.projectUrl3,
      name: user.name,
    });

    return {
      recipient,
      variables,
      subject: renderTemplate(template.subject ?? "", variables),
      body: renderTemplate(template.html, variables),
    };
  });

  const messages = renderedEmails.map(({ recipient, subject, variables }) => ({
    from: getResendFrom(),
    to: recipient.companyEmail,
    subject,
    template: { id: template.id, variables },
    ...(scheduledDate ? { scheduledAt: scheduledDate.toISOString() } : {}),
  }));

  let batchResponse;
  try {
    batchResponse = await getResend().batch.send(messages, {
      idempotencyKey: requestId,
      batchValidation: "permissive",
    });
  } catch (error) {
    console.error("[Resend] batch request outcome is unknown:", error);
    return {
      error:
        "Resend did not confirm the batch outcome. Check your Resend dashboard before retrying to avoid duplicate emails.",
    };
  }

  const providerError = batchResponse.error;
  const providerItems = batchResponse.data?.data ?? [];
  const itemErrors = new Map(
    (batchResponse.data?.errors ?? []).map((item) => [item.index, item.message]),
  );

  const successStatus = scheduledDate ? ("scheduled" as const) : ("sent" as const);

  const results = recipients.map((_, index) => {
    if (providerError) {
      return { index, status: "failed" as const, error: providerError.message };
    }

    const itemError = itemErrors.get(index);
    if (itemError) {
      return { index, status: "failed" as const, error: itemError };
    }

    if (!providerItems[index]?.id) {
      return {
        index,
        status: "failed" as const,
        error: "Resend did not return an email ID for this recipient.",
      };
    }

    return { index, status: successStatus };
  });

  if (providerError) {
    console.error("[Resend] batch send failed:", providerError);
  }

  const applicationRows = renderedEmails.map(
    ({ recipient, subject, body }, index) => {
      const result = results[index];
      const accepted = result.status !== "failed";

      return {
        userId: session.user.id,
        company,
        companyEmail: recipient.companyEmail,
        role,
        recruiterName: recipient.recruiterName || null,
        subject,
        body,
        resendEmailId: accepted ? providerItems[index]?.id ?? null : null,
        status: result.status,
        scheduledAt: accepted ? scheduledDate : null,
        sentAt: accepted && !scheduledDate ? new Date() : null,
      };
    },
  );

  try {
    await db.application.createMany({ data: applicationRows });
  } catch (error) {
    console.error("[Applications] failed to save batch results:", error);
    return {
      error:
        (providerError
          ? "Resend rejected the batch, but its failed application records could not be saved."
          : "The batch was submitted to Resend, but its application records could not be saved.") +
        " Check the application history and Resend dashboard before retrying.",
    };
  }

  revalidatePath("/applications");
  revalidatePath("/");
  return { results };
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
      select: {
        id: true,
        company: true,
        companyEmail: true,
        role: true,
        recruiterName: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        createdAt: true,
      },
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
  if (application.status === "scheduled") {
    return {
      error:
        "This application is scheduled. Cancel the schedule before resending it immediately.",
    };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  const {data:sendData, error: sendError } = await getResend().emails.send({
    from: getResendFrom(),
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
    data: {
      status: "sent",
      createdAt: new Date(),
      sentAt: new Date(),
      resendEmailId: sendData?.id ?? null,
    },
  });

  revalidatePath("/applications");
  return { success: true };
}

export async function cancelScheduledApplication(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  const application = await db.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!application) return { error: "Application not found" };
  if (application.status !== "scheduled") {
    return { error: "Only scheduled applications can be cancelled" };
  }
  if (!application.resendEmailId) {
    return { error: "This application has no Resend email to cancel" };
  }

  const { error } = await getResend().emails.cancel(application.resendEmailId);
  if (error) {
    console.error("[Resend] cancel failed:", error);
    return { error: `Could not cancel the scheduled email: ${error.message}` };
  }

  await db.application.update({
    where: { id },
    data: {
      status: "cancelled",
      scheduledAt: null,
      sentAt: null,
    },
  });

  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true };
}

export async function rescheduleApplication(
  id: string,
  scheduledAt: string,
): Promise<{ error?: string; success?: boolean; scheduledAt?: string }> {
  const session = await requireSession();

  const parsed = requiredScheduledAtSchema.safeParse(scheduledAt);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const scheduledDate = new Date(parsed.data);

  const application = await db.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!application) return { error: "Application not found" };
  if (application.status !== "scheduled") {
    return { error: "Only scheduled applications can be rescheduled" };
  }
  if (!application.resendEmailId) {
    return { error: "This application has no Resend email to reschedule" };
  }

  const { error } = await getResend().emails.update({
    id: application.resendEmailId,
    scheduledAt: scheduledDate.toISOString(),
  });
  if (error) {
    console.error("[Resend] reschedule failed:", error);
    return { error: `Could not reschedule the email: ${error.message}` };
  }

  await db.application.update({
    where: { id },
    data: {
      scheduledAt: scheduledDate,
    },
  });

  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true, scheduledAt: scheduledDate.toISOString() };
}

export async function deleteApplication(id: string): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  const application = await db.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!application) return { error: "Application not found" };

  if (application.status === "scheduled" && application.resendEmailId) {
    const { error } = await getResend().emails.cancel(application.resendEmailId);
    if (error) {
      console.error("[Resend] cancel before delete failed:", error);
      return {
        error: `Could not cancel the scheduled email before deleting: ${error.message}`,
      };
    }
  }

  await db.application.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/applications");
  revalidatePath("/");
  return { success: true };
}

export async function getDashboardStats() {
  const session = await requireSession();
  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    total,
    sentToday,
    failed,
    opened,
    clicked,
  ] = await Promise.all([
    db.application.count({
      where: { userId },
    }),

    db.application.count({
      where: {
        userId,
        status: {
          in: ["sent", "delivered", "opened", "clicked", "delivery_delayed"],
        },
        OR: [
          { sentAt: { gte: today, lt: tomorrow } },
          { sentAt: null, createdAt: { gte: today, lt: tomorrow } },
        ],
      },
    }),

    db.application.count({
      where: {
        userId,
        status: "failed",
      },
    }),

    db.application.count({
      where: {
        userId,
        status: "opened",
      },
    }),

    db.application.count({
      where: {
        userId,
        status: "clicked",
      },
    }),
  ]);

  return {
    total,
    sentToday,
    failed,
    opened,
    clicked,
  };
}

export async function getApplicationsOverTime() {
  const session = await requireSession();
  const userId = session.user.id;

  // Get last 30 days of applications
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const applications = await db.application.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate by date
  const dateMap = new Map<string, { date: string; sent: number; opened: number; clicked: number; failed: number }>();

  // Initialize with zeros for all dates in range
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dateMap.set(dateStr, { date: dateStr, sent: 0, opened: 0, clicked: 0, failed: 0 });
  }

  // Populate with actual data
  applications.forEach(app => {
    const dateStr = app.createdAt.toISOString().split('T')[0];
    const entry = dateMap.get(dateStr);
    if (entry) {
      if (app.status === "sent") entry.sent++;
      else if (app.status === "opened") entry.opened++;
      else if (app.status === "clicked") entry.clicked++;
      else if (app.status === "failed") entry.failed++;
      // If delivered, count as sent
      else if (app.status === "delivered") entry.sent++;
    }
  });

  return Array.from(dateMap.values());
}

export async function getApplicationStatusBreakdown() {
  const session = await requireSession();
  const userId = session.user.id;

  const statusCounts = await db.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  const statusMap: Record<string, string> = {
    scheduled: "Scheduled",
    sent: "Sent",
    cancelled: "Cancelled",
    delivered: "Delivered",
    opened: "Opened",
    clicked: "Clicked",
    bounced: "Bounced",
    complained: "Complained",
    delivery_delayed: "Delayed",
    failed: "Failed",
  };

  return statusCounts.map(item => ({
    name: statusMap[item.status] || item.status,
    value: item._count.status,
  }));
}

export async function getTopRoles() {
  const session = await requireSession();
  const userId = session.user.id;

  const roles = await db.application.groupBy({
    by: ["role"],
    where: { userId },
    _count: { role: true },
    orderBy: { _count: { role: "desc" } },
    take: 8,
  });

  return roles.map(item => ({
    name: item.role.length > 20 ? item.role.substring(0, 20) + "..." : item.role,
    count: item._count.role,
  }));
}

export async function getTopCompanies() {
  const session = await requireSession();
  const userId = session.user.id;

  const companies = await db.application.groupBy({
    by: ["company"],
    where: { userId },
    _count: { company: true },
    orderBy: { _count: { company: "desc" } },
    take: 8,
  });

  return companies.map(item => ({
    name: item.company.length > 20 ? item.company.substring(0, 20) + "..." : item.company,
    count: item._count.company,
  }));
}