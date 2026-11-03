"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendGmailMessage, GmailApiError } from "@/lib/gmail";
import { hasGmailSendScope } from "@/lib/gmail-scopes";
import { getUserTemplate } from "@/lib/resend-templates";
import { requireSession } from "@/lib/session";
import {
  buildTemplateVariables,
  renderTemplate,
} from "@/lib/template-variables";
import { applicationSchema } from "@/lib/validations";

export type GmailStatus = {
  connected: boolean;
};

export type GmailSendResult =
  | { success: true; messageId: string }
  | { success?: false; error: string; code?: "not_connected" | "forbidden" | "quota" | "failed" };

async function getGoogleAccountScope(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, providerId: "google" },
    select: { scope: true },
  });
  return account?.scope ?? null;
}

export async function getGmailStatus(): Promise<GmailStatus> {
  const session = await requireSession();
  const scope = await getGoogleAccountScope(session.user.id);
  return { connected: hasGmailSendScope(scope) };
}

export async function sendApplicationViaGmail(
  data: unknown,
): Promise<GmailSendResult> {
  const session = await requireSession();
  const parsed = applicationSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, code: "failed" };
  }

  const { company, companyEmail, role, recruiterName, templateId } = parsed.data;

  const [user, scope] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    getGoogleAccountScope(session.user.id),
  ]);

  if (!user) return { error: "User not found", code: "failed" };
  if (!user.resumeUrl) {
    return {
      error: "Please add your resume URL in your profile first",
      code: "failed",
    };
  }
  if (!hasGmailSendScope(scope)) {
    return {
      error: "Gmail is not connected. Connect Gmail before sending.",
      code: "not_connected",
    };
  }

  const template = await getUserTemplate(session.user.id, templateId);
  if (!template) {
    return {
      error: "Create a template in Templates before sending an application.",
      code: "failed",
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

  let accessToken: string;
  try {
    const requestHeaders = await headers();
    const token = await auth.api.getAccessToken({
      body: { providerId: "google" },
      headers: requestHeaders,
    });
    accessToken = token.accessToken;
  } catch (error) {
    console.error("[Gmail] token retrieval failed:", error);
    return {
      error: "Gmail access expired. Reconnect Gmail and try again.",
      code: "not_connected",
    };
  }

  try {
    const { id } = await sendGmailMessage({
      accessToken,
      to: companyEmail,
      subject,
      html,
    });
    return { success: true, messageId: id };
  } catch (error) {
    if (error instanceof GmailApiError) {
      if (error.status === 401) {
        return {
          error: "Gmail access expired. Reconnect Gmail and try again.",
          code: "not_connected",
        };
      }
      if (error.status === 403) {
        return {
          error:
            "Gmail permission is missing or sending is disabled. Reconnect Gmail and grant send permission.",
          code: "forbidden",
        };
      }
      if (error.status === 429) {
        return {
          error: "Gmail sending quota reached. Try again later.",
          code: "quota",
        };
      }
    }

    console.error("[Gmail] send failed:", error);
    return {
      error: "Gmail could not send the email. Please try again.",
      code: "failed",
    };
  }
}
