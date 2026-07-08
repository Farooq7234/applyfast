import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTemplates } from "@/actions/templates";
import { getProfile } from "@/actions/profile";
import { NewApplicationForm } from "@/components/dashboard/new-application-form";

export default async function NewApplicationPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const [templates, profile] = await Promise.all([
    getTemplates(),
    getProfile(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">New Application</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the job details and send your application in seconds
        </p>
      </div>
      <NewApplicationForm templates={templates} profile={profile} />
    </div>
  );
}
