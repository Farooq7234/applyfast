"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationInput } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Send,
  AlertCircle,
  Sparkles,
  Eraser,
  Edit3,
  X,
  Save,
} from "lucide-react";
import { buildEmailBody, buildEmailSubject } from "@/lib/email";
import { RoleCombobox } from "@/components/dashboard/role-combobox";
import { Template } from "@prisma/client";
import { useSendApplication } from "@/hooks/use-send-application";
import { updateTemplate } from "@/actions/templates";
import { toast } from "sonner";

// Variable tokens for insertion
const VARIABLES = [
  "{{recruiter_name}}",
  "{{role}}",
  "{{company}}",
  "{{portfolio}}",
  "{{resume}}",
  "{{name}}",
];

interface NewApplicationFormProps {
  templates: Template[];
  profile: {
    name: string;
    portfolio: string | null;
    resumeUrl: string | null;
  } | null;
  initialValues?: Partial<ApplicationInput>;
  showPreview?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
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
  initialValues = {},
  showPreview = true,
  onSuccess,
  onClose,
}: NewApplicationFormProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    templates.find((t) => t.id === initialValues.templateId) ??
      templates.find((t) => t.isDefault) ??
      templates[0] ??
      null,
  );
  const [preview, setPreview] = useState(true);
  const { isPending, sendApplication } = useSendApplication();
  const [isTemplatePending, startTemplateTransition] = useTransition();
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingSubject, setEditingSubject] = useState("");
  const [editingBody, setEditingBody] = useState("");
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
    reset,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      templateId: selectedTemplate?.id,
      ...initialValues,
    },
  });


  function handleClear() {
    reset({
      companyEmail: "",
      company: "",
      role: "",
      recruiterName: "",
      templateId: selectedTemplate?.id,
    });

    setAutoFilled({
      company: false,
      recruiterName: false,
    });

    lastAutoValues.current = {
      company: "",
      recruiterName: "",
    };

    setPreview(false);
  }

  const watchedValues = watch();

  // --- Template editing helpers ---

  function startEditingTemplate() {
    if (!selectedTemplate) return;
    setEditingSubject(selectedTemplate.subject);
    setEditingBody(selectedTemplate.body);
    setIsEditingTemplate(true);
  }

  function cancelEditingTemplate() {
    setIsEditingTemplate(false);
    setEditingSubject("");
    setEditingBody("");
  }

  function saveTemplate() {
    if (!selectedTemplate) return;
    startTemplateTransition(async () => {
      const result = await updateTemplate(selectedTemplate.id, {
        name: selectedTemplate.name,
        subject: editingSubject,
        body: editingBody,
        isDefault: selectedTemplate.isDefault,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      // Update local state immediately
      setSelectedTemplate({
        ...selectedTemplate,
        subject: editingSubject,
        body: editingBody,
      });
      toast.success("Template saved");
      setIsEditingTemplate(false);
    });
  }

  function insertVariable(textareaId: string, token: string) {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = editingBody.slice(0, start) + token + editingBody.slice(end);
    setEditingBody(next);
    // Restore cursor after token
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
      textarea.focus();
    });
  }

  // --- End template editing helpers ---

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

  const activeTemplateBody = isEditingTemplate ? editingBody : (selectedTemplate?.body ?? "");
  const activeTemplateSubject = isEditingTemplate ? editingSubject : (selectedTemplate?.subject ?? "");

  const previewBody = selectedTemplate
    ? buildEmailBody(activeTemplateBody, {
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
        activeTemplateSubject,
        watchedValues.role ?? "{{role}}",
        watchedValues.company ?? "{{company}}",
      )
    : "";

  function onSubmit(data: ApplicationInput) {
    void sendApplication(data, () => {
      if (onSuccess) {
        onSuccess();
        handleClear();
      }
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
                onClick={() => router.push("/profile")}
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
    <div
      className={
        showPreview
          ? "grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2"
          : "w-full"
      }
    >
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
                  className="flex h-9 w-full  border border-input bg-transparent px-3 py-1 text-sm  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? "Sending..." : "Send Application"}
          </Button>

          {showPreview && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? "Hide" : "Preview"}
            </Button>
          )}

          <Button
            type="button"
            variant="destructive"
            onClick={handleClear}
            disabled={isPending}
            className="gap-2"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Preview */}
      {showPreview && preview && (
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Preview
                </p>
                {selectedTemplate && !isEditingTemplate && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={startEditingTemplate}
                    className="gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Template
                  </Button>
                )}
              </div>

              {isEditingTemplate ? (
                <div className="flex flex-col gap-3">
                  {/* Variable helpers */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="insert-vars" className="text-xs">
                      Insert Variables
                    </Label>
                    <div id="insert-vars" className="flex flex-wrap gap-1.5">
                      {VARIABLES.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable("template-body-input", v)}
                          className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono hover:bg-secondary transition-colors"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject edit */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="template-subject-input" className="text-xs">
                      Subject
                    </Label>
                    <Input
                      id="template-subject-input"
                      value={editingSubject}
                      onChange={(e) => setEditingSubject(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* Body edit */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="template-body-input" className="text-xs">
                      Body (HTML supported)
                    </Label>
                    <textarea
                      id="template-body-input"
                      value={editingBody}
                      onChange={(e) => setEditingBody(e.target.value)}
                      className="flex min-h-[350px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditingTemplate}
                      disabled={isTemplatePending}
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveTemplate}
                      disabled={isTemplatePending}
                      className="gap-1.5"
                    >
                      {isTemplatePending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Subject
                    </p>
                    <p className="text-sm font-medium">
                      {previewSubject || "Fill in role to see subject"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Body
                    </p>

                    {previewBody ? (
                      <div className="overflow-auto border bg-background p-4">
                        <div dangerouslySetInnerHTML={{ __html: previewBody }} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Fill in the form to see preview
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
