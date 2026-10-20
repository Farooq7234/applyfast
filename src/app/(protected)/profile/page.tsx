
import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ResendUsageCard } from "@/components/dashboard/resend-usage-card";

export default async function ProfilePage() {


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
      <ResendUsageCard />
    </div>
  );
}
