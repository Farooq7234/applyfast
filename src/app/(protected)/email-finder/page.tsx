import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTemplates } from "@/actions/templates";
import { getProfile } from "@/actions/profile";
import { EmailFinderClient } from "./email-finder-client";

export default async function EmailFinderPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const [templates, profile] = await Promise.all([
    getTemplates(),
    getProfile(),
  ]);

  return (
    <EmailFinderClient templates={templates} profile={profile} />
  );
}