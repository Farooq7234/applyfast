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

  const {
    name,
    portfolio,
    linkedin,
    github,
    phone,
    projectUrl1,
    projectUrl2,
    projectUrl3,
  } = parsed.data;

  const projectUpdates =
    projectUrl1 === undefined &&
    projectUrl2 === undefined &&
    projectUrl3 === undefined
      ? {}
      : {
          projectUrl1: projectUrl1 || null,
          projectUrl2: projectUrl2 || null,
          projectUrl3: projectUrl3 || null,
        };

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      portfolio: portfolio || null,
      linkedin: linkedin || null,
      github: github || null,
      phone: phone || null,
      ...projectUpdates,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateResumeUrl(resumeUrl: string): Promise<{ error?: string; success?: boolean }> {
  const session = await requireSession();

  await db.user.update({
    where: { id: session.user.id },
    data: { resumeUrl },
  });

  revalidatePath("/profile");
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
      projectUrl1: true,
      projectUrl2: true,
      projectUrl3: true,
      createdAt: true,
    },
  });

  return user;
}
