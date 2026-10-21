"use server";

import { requireSession } from "@/lib/session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createUserTemplate,
  deleteUserTemplate,
  listUserTemplates,
  updateUserTemplate,
} from "@/lib/resend-templates";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(10, "Body must be at least 10 characters"),
});

const BLOCK_HTML_TAG =
  /<(?:html|head|body|p|div|br|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6]|blockquote|section|article|header|footer|hr)\b/i;

function formatTemplateBody(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n").trim();

  if (BLOCK_HTML_TAG.test(normalized)) return normalized;

  return normalized
    .split(/\n\s*\n/)
    .map(
      (paragraph) =>
        `<p>${paragraph
          .split("\n")
          .map((line) => line.trim())
          .join("<br />")}</p>`,
    )
    .join("");
}

function revalidateTemplatePages() {
  revalidatePath("/templates");
  revalidatePath("/applications/new");
  revalidatePath("/email-finder");
}

export async function getTemplates() {
  const session = await requireSession();
  return listUserTemplates(session.user.id);
}

export async function createTemplate(
  data: unknown,
): Promise<{ error?: string; id?: string }> {
  const session = await requireSession();
  const parsed = templateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await createUserTemplate(session.user.id, {
    ...parsed.data,
    body: formatTemplateBody(parsed.data.body),
  });
  if (result.error) return { error: result.error };

  revalidateTemplatePages();
  return { id: result.id };
}

export async function updateTemplate(
  id: string,
  data: unknown,
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const parsed = templateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await updateUserTemplate(session.user.id, id, {
    ...parsed.data,
    body: formatTemplateBody(parsed.data.body),
  });
  if (result.error) return { error: result.error };

  revalidateTemplatePages();
  return { success: true };
}

export async function deleteTemplate(
  id: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  const result = await deleteUserTemplate(session.user.id, id);
  if (result.error) return { error: result.error };

  revalidateTemplatePages();
  return { success: true };
}
