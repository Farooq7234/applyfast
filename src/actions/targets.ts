"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { emptyToNull, normalizeWebsite } from "@/lib/website";
import {
  createTargetContactSchema,
  createTargetSchema,
  updateTargetSchema,
  type TargetStatusValue,
} from "@/lib/validations";

const contactOrder = { createdAt: "desc" as const };

function revalidateTargets() {
  revalidatePath("/targets");
}

function isUniqueConstraint(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function getTargetCompanies() {
  const session = await requireSession();
  return db.targetCompany.findMany({
    where: { userId: session.user.id },
    include: { contacts: { orderBy: contactOrder } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTargetCompany(id: string) {
  const session = await requireSession();
  return db.targetCompany.findFirst({
    where: { id, userId: session.user.id },
    include: { contacts: { orderBy: contactOrder } },
  });
}

export async function createTarget(
  data: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await requireSession();
  const parsed = createTargetSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let website: string;
  try {
    website = normalizeWebsite(parsed.data.website);
  } catch {
    return { error: "Must be a valid URL" };
  }

  try {
    const company = await db.targetCompany.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name.trim(),
        website,
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
  if (input.techStack !== undefined) {
    updateData.techStack = input.techStack.map((item) => item.trim()).filter(Boolean);
  }
  if (input.careersUrl !== undefined) {
    updateData.careersUrl = emptyToNull(input.careersUrl);
  }
  if (input.linkedinUrl !== undefined) {
    updateData.linkedinUrl = emptyToNull(input.linkedinUrl);
  }
  if (input.oneLiner !== undefined) updateData.oneLiner = emptyToNull(input.oneLiner);
  if (input.industry !== undefined) updateData.industry = emptyToNull(input.industry);
  if (input.companySize !== undefined) {
    updateData.companySize = emptyToNull(input.companySize);
  }
  if (input.location !== undefined) updateData.location = emptyToNull(input.location);
  if (input.fundingStage !== undefined) {
    updateData.fundingStage = emptyToNull(input.fundingStage);
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

export async function addTargetContact(
  companyId: string,
  data: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await requireSession();
  const parsed = createTargetContactSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const company = await db.targetCompany.findFirst({
    where: { id: companyId, userId: session.user.id },
  });
  if (!company) return { error: "Company not found" };

  const contact = await db.targetContact.create({
    data: {
      companyId,
      name: parsed.data.name.trim(),
      role: emptyToNull(parsed.data.role),
      email: emptyToNull(parsed.data.email),
      linkedinUrl: emptyToNull(parsed.data.linkedinUrl),
      notes: emptyToNull(parsed.data.notes),
    },
  });

  revalidateTargets();
  return { id: contact.id };
}

export async function deleteTargetContact(
  companyId: string,
  contactId: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const company = await db.targetCompany.findFirst({
    where: { id: companyId, userId: session.user.id },
  });
  if (!company) return { error: "Company not found" };

  const contact = await db.targetContact.findFirst({
    where: { id: contactId, companyId },
  });
  if (!contact) return { error: "Contact not found" };

  await db.targetContact.delete({ where: { id: contactId } });
  revalidateTargets();
  return { success: true };
}
