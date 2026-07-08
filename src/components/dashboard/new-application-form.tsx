"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationInput } from "@/lib/validations";
import { createApplication } from "@/actions/applications";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { buildEmailBody, buildEmailSubject } from "@/lib/email";
import type { Template } from "@/generated/prisma/client";

interface NewApplicationFormProps {
  templates: Template[];
  profile: {
    name: string;
    portfolio: string | null;
    resumeUrl: string | null;
  } | null;
}

export function NewApplicationForm({ templates, profile }: NewApplicationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    templates.find((t) => t.isDefault) ?? templates[0] ?? null
  );
  const [preview, setPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      templateId: selectedTemplate?.id,
    },
  });

  const watchedValues = watch();

  const previewBody = selectedTemplate
    ? buildEmailBody(selectedTemplate.body, {
        role: watchedValues.role ?? "{{role}}",
        company: watchedValues.company ?? "{{company}}",
        recruiterName: watchedValues.recruiterName,
        portfolio: profile?.portfolio ?? undefined,
        resumeUrl: profile?.resumeUrl ?? undefined,
        name: profile?.name ?? "{{name}}",
      })
    : "";

  const previewSubject = selectedTemplate
    ? buildEmailSubject(selectedTemplate.subject, watchedValues.role ?? "{{role}}", watchedValues.company ?? "{{company}}")
    : "";

  function onSubmit(data: ApplicationInput) {
    startTransition(async () => {
      const result = await createApplication(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application sent!");
      router.push("/dashboard/applications");
    });
  }

  if (!profile?.resumeUrl) {    return (
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Resume required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You need to upload a resume before sending applications.
              </p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => router.push("/dashboard/profile")}
              >
                Go to Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-5xl">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company">Company Name *</Label>
              <Input id="company" placeholder="Acme Corp" {...register("company")} />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyEmail">Company Email *</Label>
              <Input id="companyEmail" type="email" placeholder="jobs@acme.com" {...register("companyEmail")} />
              {errors.companyEmail && <p className="text-xs text-destructive">{errors.companyEmail.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Role *</Label>
              <Input id="role" placeholder="Senior Frontend Engineer" {...register("role")} />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recruiterName">Recruiter Name (optional)</Label>
              <Input id="recruiterName" placeholder="John Smith" {...register("recruiterName")} />
            </div>

            {templates.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Email Template</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedTemplate?.id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setValue("templateId", id || undefined);
                    setSelectedTemplate(templates.find((t) => t.id === id) ?? null);
                  }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 gap-2" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? "Sending..." : "Send Application"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? "Hide" : "Preview"}
          </Button>
        </div>
      </form>

      {/* Preview */}
      {preview && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Email Preview</p>
          <Card>
            <CardContent className="pt-4 flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                <p className="text-sm font-medium">{previewSubject || "Fill in role to see subject"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Body</p>
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {previewBody || "Fill in the form to see preview"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
