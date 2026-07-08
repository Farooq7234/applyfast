import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const profile = await getProfile();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your profile info is used in every application you send
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
