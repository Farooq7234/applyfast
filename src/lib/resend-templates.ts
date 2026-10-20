import { createHash, randomUUID } from "node:crypto";
import { getResend } from "@/lib/email";
import {
  TEMPLATE_VARIABLE_KEYS,
  type UserTemplate,
} from "@/lib/template-variables";

const ALIAS_PREFIX = "af";

const TEMPLATE_VARIABLES = TEMPLATE_VARIABLE_KEYS.map((key) => ({
  key,
  type: "string" as const,
}));

function aliasPrefixForUser(userId: string): string {
  const userKey = createHash("sha256").update(userId).digest("hex").slice(0, 16);
  return `${ALIAS_PREFIX}-${userKey}-`;
}

function isOwnedByUser(alias: string | null, userId: string): boolean {
  return alias?.startsWith(aliasPrefixForUser(userId)) ?? false;
}

function toUserTemplate(template: {
  id: string;
  name: string;
  subject: string | null;
  html: string;
  status: "draft" | "published";
  alias: string | null;
  updated_at: string;
}): UserTemplate {
  return {
    id: template.id,
    name: template.name,
    subject: template.subject,
    html: template.html,
    status: template.status,
    alias: template.alias,
    updatedAt: template.updated_at,
  };
}

type TemplateSummary = {
  id: string;
  alias: string | null;
};

async function listAllTemplates(): Promise<TemplateSummary[]> {
  const resend = getResend();
  const templates: TemplateSummary[] = [];

  let after: string | undefined;

  for (;;) {
    const { data, error } = await resend.templates.list({
      limit: 100,
      ...(after ? { after } : {}),
    });

    if (error) {
      console.error("[Resend] templates.list failed:", error);
      return templates;
    }

    templates.push(
      ...data.data.map((template) => ({
        id: template.id,
        alias: template.alias,
      })),
    );

    if (!data.has_more || data.data.length === 0) break;
    after = data.data[data.data.length - 1]?.id;
    if (!after) break;
  }

  return templates;
}

export async function listUserTemplates(userId: string): Promise<UserTemplate[]> {
  const templates = await listAllTemplates();
  const owned = templates.filter((template) =>
    isOwnedByUser(template.alias, userId),
  );

  const resend = getResend();
  const details = await Promise.all(
    owned.map(async (template) => {
      const { data, error } = await resend.templates.get(template.id);
      if (error || !data) {
        console.error("[Resend] templates.get failed:", error);
        return null;
      }
      return toUserTemplate(data);
    }),
  );

  return details
    .filter((template): template is UserTemplate => template !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getUserTemplate(
  userId: string,
  templateId: string,
): Promise<UserTemplate | null> {
  const { data, error } = await getResend().templates.get(templateId);
  if (error || !data || !isOwnedByUser(data.alias, userId)) {
    return null;
  }
  return toUserTemplate(data);
}

export async function createUserTemplate(
  userId: string,
  input: { name: string; subject: string; body: string },
): Promise<{ id?: string; error?: string }> {
  const resend = getResend();
  const alias = `${aliasPrefixForUser(userId)}${randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)}`;

  const { data, error } = await resend.templates.create({
    name: input.name,
    subject: input.subject,
    html: input.body,
    alias,
    variables: TEMPLATE_VARIABLES,
  });

  if (error || !data) {
    console.error("[Resend] templates.create failed:", error);
    return { error: error?.message ?? "Could not create the template" };
  }

  const { error: publishError } = await resend.templates.publish(data.id);
  if (publishError) {
    console.error("[Resend] templates.publish failed:", publishError);
    return { error: publishError.message };
  }

  return { id: data.id };
}

export async function updateUserTemplate(
  userId: string,
  templateId: string,
  input: { name: string; subject: string; body: string },
): Promise<{ success?: boolean; error?: string }> {
  const existing = await getUserTemplate(userId, templateId);
  if (!existing) return { error: "Template not found" };

  const resend = getResend();
  const { error } = await resend.templates.update(templateId, {
    name: input.name,
    subject: input.subject,
    html: input.body,
    variables: TEMPLATE_VARIABLES,
  });

  if (error) {
    console.error("[Resend] templates.update failed:", error);
    return { error: error.message };
  }

  const { error: publishError } = await resend.templates.publish(templateId);
  if (publishError) {
    console.error("[Resend] templates.publish failed:", publishError);
    return { error: publishError.message };
  }

  return { success: true };
}

export async function deleteUserTemplate(
  userId: string,
  templateId: string,
): Promise<{ success?: boolean; error?: string }> {
  const existing = await getUserTemplate(userId, templateId);
  if (!existing) return { error: "Template not found" };

  const { error } = await getResend().templates.remove(templateId);
  if (error) {
    console.error("[Resend] templates.remove failed:", error);
    return { error: error.message };
  }

  return { success: true };
}
