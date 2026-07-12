"use client";

import { useState, useTransition, useRef } from "react";
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
import { Loader2, Send, AlertCircle, Sparkles } from "lucide-react";
import { buildEmailBody, buildEmailSubject } from "@/lib/email";
import { RoleCombobox } from "@/components/dashboard/role-combobox";
import { Template } from "@prisma/client";

interface NewApplicationFormProps {
  templates: Template[];
  profile: {
    name: string;
    portfolio: string | null;
    resumeUrl: string | null;
  } | null;
}

// ---- Email parsing helpers ----

// local parts that mean "no real person", so we skip recruiter name
const GENERIC_LOCAL_PARTS = new Set([
  "careers",
  "career",
  "jobs",
  "job",
  "hr",
  "hiring",
  "recruiting",
  "recruiter",
  "talent",
  "people",
  "info",
  "contact",
  "team",
  "admin",
  "support",
  "apply",
  "resume",
  "resumes",
  "hello",
]);

// subdomains / prefixes to strip before extracting company name from domain
const DOMAIN_PREFIXES_TO_STRIP = [
  "careers",
  "jobs",
  "mail",
  "smtp",
  "hr",
  "talent",
  "www",
];

function capitalize(word: string) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function extractCompanyFromDomain(domain: string): string {
  // domain e.g. "careers.acme-corp.co.in" -> "Acme Corp"
  let parts = domain.toLowerCase().split(".");

  // strip known non-company prefixes (careers.acme.com -> acme.com)
  while (parts.length > 2 && DOMAIN_PREFIXES_TO_STRIP.includes(parts[0])) {
    parts = parts.slice(1);
  }

  // the company segment is usually the first label left before the TLD chain
  // (acme.com -> acme | acme.co.in -> acme | acme-corp.in -> acme-corp)
  const companySegment = parts[0] ?? "";

  return companySegment.split(/[-_]/).filter(Boolean).map(capitalize).join(" ");
}

function extractRecruiterFromLocalPart(localPart: string): string {
  const cleaned = localPart.toLowerCase().trim();

  if (GENERIC_LOCAL_PARTS.has(cleaned)) return "";

  // firstname.lastname / firstname_lastname / firstname-lastname
  const nameParts = cleaned
    .split(/[._-]+/)
    .filter((p) => p.length > 0 && isNaN(Number(p))); // drop stray numbers like john123

  if (nameParts.length === 0) return "";

  // strip trailing digits from each chunk (e.g. "john99" -> "john")
  const cleanedParts = nameParts
    .map((p) => p.replace(/\d+$/, ""))
    .filter(Boolean);

  if (cleanedParts.length === 0) return "";
  if (cleanedParts.length === 1 && GENERIC_LOCAL_PARTS.has(cleanedParts[0]))
    return "";

  return cleanedParts.map(capitalize).join(" ");
}

function parseEmail(
  email: string,
): { company: string; recruiterName: string } | null {
  const match = email.trim().match(/^([^\s@]+)@([^\s@]+\.[^\s@]+)$/);
  if (!match) return null;

  const [, localPart, domain] = match;

  return {
    company: extractCompanyFromDomain(domain),
    recruiterName: extractRecruiterFromLocalPart(localPart),
  };
}

// ---- Component ----

export function NewApplicationForm({
  templates,
  profile,
}: NewApplicationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    templates.find((t) => t.isDefault) ?? templates[0] ?? null,
  );
  const [preview, setPreview] = useState(false);
  const [autoFilled, setAutoFilled] = useState<{
    company: boolean;
    recruiterName: boolean;
  }>({
    company: false,
    recruiterName: false,
  });

  // track values we auto-filled, so we don't clobber a manual edit on the next paste
  const lastAutoValues = useRef<{ company: string; recruiterName: string }>({
    company: "",
    recruiterName: "",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      templateId: selectedTemplate?.id,
    },
  });

  const watchedValues = watch();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const email = e.target.value;
    const parsed = parseEmail(email);
    if (!parsed) return;

    const current = getValues();

    // only auto-fill company if it's empty or still equals what we auto-filled last time
    if (
      parsed.company &&
      (!current.company || current.company === lastAutoValues.current.company)
    ) {
      setValue("company", parsed.company, { shouldValidate: true });
      lastAutoValues.current.company = parsed.company;
      setAutoFilled((s) => ({ ...s, company: true }));
    }

    // same guard for recruiter name; skip if we couldn't confidently extract one
    if (
      parsed.recruiterName &&
      (!current.recruiterName ||
        current.recruiterName === lastAutoValues.current.recruiterName)
    ) {
      setValue("recruiterName", parsed.recruiterName, { shouldValidate: true });
      lastAutoValues.current.recruiterName = parsed.recruiterName;
      setAutoFilled((s) => ({ ...s, recruiterName: true }));
    }
  }

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
    ? buildEmailSubject(
        selectedTemplate.subject,
        watchedValues.role ?? "{{role}}",
        watchedValues.company ?? "{{company}}",
      )
    : "";

  function onSubmit(data: ApplicationInput) {
    startTransition(async () => {
      const result = await createApplication(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Application sent!");
    });
  }

  if (!profile?.resumeUrl) {
    return (
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-6xl">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            {/* Email is now the first field — paste it and company/recruiter auto-fill */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyEmail">Company Email *</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="firstname.lastname@company.com"
                {...register("companyEmail", { onChange: handleEmailChange })}
              />
              {errors.companyEmail && (
                <p className="text-xs text-destructive">
                  {errors.companyEmail.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Paste any format — name@company.com, first.last@company.in, or
                careers@company.com — and we'll fill in the fields below.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="company">Company Name *</Label>
                {autoFilled.company && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Sparkles className="h-3 w-3" /> auto
                  </span>
                )}
              </div>
              <Input
                id="company"
                placeholder="Acme Corp"
                {...register("company", {
                  onChange: () =>
                    setAutoFilled((s) => ({ ...s, company: false })),
                })}
              />
              {errors.company && (
                <p className="text-xs text-destructive">
                  {errors.company.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Role *</Label>
              <RoleCombobox
                value={watchedValues.role ?? ""}
                onChange={(val) =>
                  setValue("role", val, { shouldValidate: true })
                }
                onBlur={() => {}}
                error={errors.role?.message}
              />
              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="recruiterName">Recruiter Name (optional)</Label>
                {autoFilled.recruiterName && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Sparkles className="h-3 w-3" /> auto
                  </span>
                )}
              </div>
              <Input
                id="recruiterName"
                placeholder="John Smith"
                {...register("recruiterName", {
                  onChange: () =>
                    setAutoFilled((s) => ({ ...s, recruiterName: false })),
                })}
              />
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
                    setSelectedTemplate(
                      templates.find((t) => t.id === id) ?? null,
                    );
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
          <Card>
            <CardContent className=" flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Subject
                </p>
                <p className="text-sm font-medium">
                  {previewSubject || "Fill in role to see subject"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Body
                </p>

                {previewBody ? (
                  <div className="rounded-md border bg-background p-4 overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: previewBody }} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Fill in the form to see preview
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
