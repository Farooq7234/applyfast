"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { emptyToNull, normalizeWebsite } from "@/lib/website";
import {
  createTargetSchema,
  updateTargetSchema,
  type TargetStatusValue,
} from "@/lib/validations";

function revalidateTargets() {
  revalidatePath("/targets");
}

function isUniqueConstraint(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function normalizeOptionalUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return normalizeWebsite(value);
}

function normalizeEmailList(emails: string[] | undefined): string[] | undefined {
  if (emails === undefined) return undefined;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push(email);
  }
  return result;
}

export async function getTargetCompanies() {
  const session = await requireSession();
  return db.targetCompany.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTarget(
  data: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await requireSession();
  const parsed = createTargetSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let website: string;
  let careersUrl: string | null;
  try {
    website = normalizeWebsite(parsed.data.website);
    careersUrl = normalizeOptionalUrl(parsed.data.careersUrl);
  } catch {
    return { error: "Enter a valid website or careers URL" };
  }

  try {
    const company = await db.targetCompany.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name.trim(),
        website,
        careersUrl,
        location: emptyToNull(parsed.data.location),
        contactEmails: normalizeEmailList(parsed.data.contactEmails) ?? [],
        status: parsed.data.status ?? "RESEARCHING",
      },
    });
    revalidateTargets();
    return { id: company.id };
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return { error: "This website is already on your list" };
    }
    throw error;
  }
}

export async function updateTarget(
  id: string,
  data: unknown
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const parsed = updateTargetSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.targetCompany.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Company not found" };

  const input = parsed.data;
  const updateData: Prisma.TargetCompanyUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.status !== undefined) updateData.status = input.status;
  if (input.location !== undefined) updateData.location = emptyToNull(input.location);
  if (input.contactEmails !== undefined) {
    updateData.contactEmails = normalizeEmailList(input.contactEmails) ?? [];
  }
  if (input.careersUrl !== undefined) {
    try {
      updateData.careersUrl = normalizeOptionalUrl(input.careersUrl);
    } catch {
      return { error: "Careers URL must be a valid URL" };
    }
  }

  if (input.website !== undefined) {
    try {
      updateData.website = normalizeWebsite(input.website);
    } catch {
      return { error: "Must be a valid URL" };
    }
  }

  try {
    await db.targetCompany.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return { error: "This website is already on your list" };
    }
    throw error;
  }

  revalidateTargets();
  return { success: true };
}

export async function updateTargetStatus(
  id: string,
  status: TargetStatusValue
): Promise<{ error?: string; success?: boolean }> {
  return updateTarget(id, { status });
}

export async function deleteTarget(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const existing = await db.targetCompany.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { error: "Company not found" };

  await db.targetCompany.delete({ where: { id } });
  revalidateTargets();
  return { success: true };
}
