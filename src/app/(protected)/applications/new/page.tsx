import { Suspense } from "react";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTemplates } from "@/actions/templates";
import { getProfile } from "@/actions/profile";
import { getGmailStatus } from "@/actions/gmail";
import { NewApplicationForm, NewApplicationFormSkeleton } from "@/components/dashboard/new-application-form";

async function NewApplicationContent() {
  const [templates, profile, gmailStatus] = await Promise.all([
    getTemplates(),
    getProfile(),
    getGmailStatus(),
  ]);

  return (
    <NewApplicationForm
      templates={templates}
      profile={profile}
      gmailConnected={gmailStatus.connected}
    />
  );
}

export default async function NewApplicationPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6 p-6 bg-background">
      <div>
        <h1 className="text-xl text-muted-foreground font-semibold">New Application</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the job details and send your application in seconds
        </p>
      </div>
      <Suspense fallback={<NewApplicationFormSkeleton />}>
        <NewApplicationContent />
      </Suspense>
    </div>
  );
}
