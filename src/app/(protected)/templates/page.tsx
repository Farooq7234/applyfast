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
          Manage your Resend email templates. Use{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{RECRUITER_NAME}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{ROLE}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{COMPANY}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{PORTFOLIO}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{LINKEDIN}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{GITHUB}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{PHONE}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{RESUME}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{PROJECT_1}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{PROJECT_2}}}"}
          </code>
          {", "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{PROJECT_3}}}"}
          </code>
          {" and "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{{NAME}}}"}
          </code>{" "}
          as placeholders they get filled automatically when you send.
        </p>
      </div>
      <TemplatesList templates={templates} />
    </div>
  );
}
