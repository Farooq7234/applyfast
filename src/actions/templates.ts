"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  TEMPLATE_HIRING_NAME,
  TEMPLATE_HIRING_SUBJECT,
  TEMPLATE_HIRING_BODY,
  TEMPLATE_COLD_NAME,
  TEMPLATE_COLD_SUBJECT,
  TEMPLATE_COLD_BODY,
} from "@/lib/email";

// ─── Validation ──────────────────────────────────────────────────────────────

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(10, "Body must be at least 10 characters"),
  isDefault: z.boolean().optional(),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getTemplates() {
  const session = await requireSession();
  return db.template.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function getTemplate(id: string) {
  const session = await requireSession();
  return db.template.findFirst({
    where: { id, userId: session.user.id },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createTemplate(data: unknown): Promise<{ error?: string; id?: string }> {
  const session = await requireSession();
  const parsed = templateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, subject, body, isDefault } = parsed.data;

  // If setting as default, unset existing defaults first
  if (isDefault) {
    await db.template.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await db.template.create({
    data: {
      userId: session.user.id,
      name,
      subject,
      body,
      isDefault: isDefault ?? false,
    },
  });

  revalidatePath("/dashboard/templates");
  return { id: template.id };
}

export async function updateTemplate(
  id: string,
  data: unknown
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const parsed = templateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, subject, body, isDefault } = parsed.data;

  // Verify ownership
  const existing = await db.template.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Template not found" };

  // If setting as default, unset others first
  if (isDefault && !existing.isDefault) {
    await db.template.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  await db.template.update({
    where: { id },
    data: { name, subject, body, isDefault: isDefault ?? existing.isDefault },
  });

  revalidatePath("/dashboard/templates");
  return { success: true };
}

export async function deleteTemplate(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  const existing = await db.template.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Template not found" };
  if (existing.isDefault) return { error: "Cannot delete the default template" };

  await db.template.delete({ where: { id } });

  revalidatePath("/dashboard/templates");
  return { success: true };
}

export async function setDefaultTemplate(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  const existing = await db.template.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Template not found" };

  await db.template.updateMany({
    where: { userId: session.user.id },
    data: { isDefault: false },
  });

  await db.template.update({ where: { id }, data: { isDefault: true } });

  revalidatePath("/dashboard/templates");
  return { success: true };
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────

export async function ensureDefaultTemplates(userId: string) {
  const existing = await db.template.findMany({ where: { userId } });
  const names = existing.map((t) => t.name);

  const toCreate: {
    name: string;
    subject: string;
    body: string;
    isDefault: boolean;
  }[] = [];

  if (!names.includes(TEMPLATE_HIRING_NAME)) {
    toCreate.push({
      name: TEMPLATE_HIRING_NAME,
      subject: TEMPLATE_HIRING_SUBJECT,
      body: TEMPLATE_HIRING_BODY,
      isDefault: true,
    });
  }

  if (!names.includes(TEMPLATE_COLD_NAME)) {
    toCreate.push({
      name: TEMPLATE_COLD_NAME,
      subject: TEMPLATE_COLD_SUBJECT,
      body: TEMPLATE_COLD_BODY,
      isDefault: false,
    });
  }

  if (toCreate.length > 0) {
    await db.template.createMany({
      data: toCreate.map((t) => ({ ...t, userId })),
    });
  }
}

export const ensureDefaultTemplate = ensureDefaultTemplates;
