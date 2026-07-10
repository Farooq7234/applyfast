import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTemplates } from "@/actions/templates";
import { TemplatesList } from "@/components/dashboard/templates-list";

export default async function TemplatesPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const templates = await getTemplates();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Manage your email templates. Use{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{recruiter_name}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{role}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{company}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{portfolio}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{resume}}"}
          </code>
          {" and "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{name}}"}
          </code>{" "}
          as placeholders — they get filled automatically when you send.
        </p>
      </div>
      <TemplatesList templates={templates} />
    </div>
  );
}
