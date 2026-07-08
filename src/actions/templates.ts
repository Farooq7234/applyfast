"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  TEMPLATE_HIRING_NAME,
  TEMPLATE_HIRING_SUBJECT,
  TEMPLATE_HIRING_BODY,
  TEMPLATE_COLD_NAME,
  TEMPLATE_COLD_SUBJECT,
  TEMPLATE_COLD_BODY,
} from "@/lib/email";

export async function getTemplates() {
  const session = await requireSession();
  return db.template.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function ensureDefaultTemplates(userId: string) {
  const existing = await db.template.findMany({ where: { userId } });
  const names = existing.map((t) => t.name);

  const toCreate: { name: string; subject: string; body: string; isDefault: boolean }[] = [];

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

// Keep old name as alias so existing callers don't break
export const ensureDefaultTemplate = ensureDefaultTemplates;
