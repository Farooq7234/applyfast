import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="flex flex-col gap-4 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{session.user.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{session.user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge variant="secondary">Free</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-up Cron</CardTitle>
            <CardDescription>
              Automated follow-up endpoint for cron job integration
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Call this endpoint from your cron job to automatically send follow-up emails:
            </p>
            <code className="rounded-md bg-muted px-3 py-2 text-xs font-mono">
              GET /api/follow-up
            </code>
            <p className="text-xs text-muted-foreground">
              Set <code className="text-xs bg-muted px-1 rounded">CRON_SECRET</code> env var and pass it as{" "}
              <code className="text-xs bg-muted px-1 rounded">Authorization: Bearer &lt;secret&gt;</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
