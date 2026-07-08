"use server";

import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: unknown): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, portfolio, linkedin, github, phone } = parsed.data;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      portfolio: portfolio || null,
      linkedin: linkedin || null,
      github: github || null,
      phone: phone || null,
    },
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function updateResumeUrl(resumeUrl: string): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  await db.user.update({
    where: { id: session.user.id },
    data: { resumeUrl },
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function getProfile() {
  const session = await requireSession();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      portfolio: true,
      linkedin: true,
      github: true,
      phone: true,
      resumeUrl: true,
      createdAt: true,
    },
  });

  return user;
}
