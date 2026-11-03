"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  applicationSchema,
  batchApplicationSchema,
  requiredScheduledAtSchema,
  type ApplicationInput,
} from "@/lib/validations";
import {
  formatScheduledAt,
  fromDateTimeLocalValue,
  getScheduleBounds,
} from "@/lib/scheduling";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Send,
  AlertCircle,
  Sparkles,
  Eraser,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { RoleCombobox } from "@/components/dashboard/role-combobox";
import { SchedulePresetButtons } from "@/components/dashboard/schedule-presets";
import {
  buildTemplateVariables,
  renderTemplate,
  type UserTemplate,
} from "@/lib/template-variables";
import { useSendApplication } from "@/hooks/use-send-application";
import { linkSocial } from "@/lib/auth-client";
import { GMAIL_SEND_SCOPE } from "@/lib/gmail-scopes";
import { toast } from "sonner";

interface NewApplicationFormProps {
  templates: UserTemplate[];
  profile: {
    name: string;
    portfolio: string | null;
    linkedin: string | null;
    github: string | null;
    phone: string | null;
    resumeUrl: string | null;
    projectUrl1: string | null;
    projectUrl2: string | null;
    projectUrl3: string | null;
  } | null;
  initialValues?: Partial<ApplicationInput>;
  showPreview?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  allowBatch?: boolean;
  gmailConnected?: boolean;
}

interface BatchRecipient {
  id: string;
  companyEmail: string;
  recruiterName: string;
  nameEdited: boolean;
}

interface BatchSendResult {
  index: number;
  status: "sent" | "scheduled" | "failed";
  error?: string;
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
  allowBatch = true,
  gmailConnected = false,
}: NewApplicationFormProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(
    templates.find((t) => t.id === initialValues.templateId) ??
      templates[0] ??
      null,
  );
  const [preview, setPreview] = useState(true);
  const {
    isPending,
    isGmailPending,
    sendApplication,
    sendApplicationsBatch,
    sendWithGmail,
  } = useSendApplication();
  const [batchMode, setBatchMode] = useState(false);
  const [batchRecipients, setBatchRecipients] = useState<BatchRecipient[]>(
    () => [
      {
        id: crypto.randomUUID(),
        companyEmail: "",
        recruiterName: "",
        nameEdited: false,
      },
    ],
  );
  const [batchResults, setBatchResults] = useState<BatchSendResult[] | null>(
    null,
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
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

    setBatchRecipients([
      {
        id: crypto.randomUUID(),
        companyEmail: "",
        recruiterName: "",
        nameEdited: false,
      },
    ]);
    setBatchResults(null);
    setScheduleEnabled(false);
    setScheduledAtLocal("");
    setPreview(false);
  }

  const watchedValues = watch();
  const scheduleBounds = getScheduleBounds();

  function getValidatedScheduledAt(): string | undefined | null {
    if (!scheduleEnabled) return undefined;
    if (!scheduledAtLocal) {
      toast.error("Choose a date and time to schedule the email.");
      return null;
    }

    const scheduledAt = fromDateTimeLocalValue(scheduledAtLocal);
    const parsed = requiredScheduledAtSchema.safeParse(scheduledAt);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return null;
    }

    return parsed.data;
  }

  function handleScheduleToggle(enabled: boolean) {
    setScheduleEnabled(enabled);
    if (!enabled) setScheduledAtLocal("");
    setBatchResults(null);
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

  function updateBatchEmail(id: string, companyEmail: string) {
    const inferred = parseEmail(companyEmail);
    setBatchResults(null);
    setBatchRecipients((current) =>
      current.map((recipient) =>
        recipient.id === id
          ? {
              ...recipient,
              companyEmail,
              recruiterName: recipient.nameEdited
                ? recipient.recruiterName
                : inferred
                  ? inferred.recruiterName || "team"
                  : "",
            }
          : recipient,
      ),
    );
  }

  function addBatchRecipient() {
    if (batchRecipients.length >= 100) {
      toast.error("Resend allows up to 100 emails per batch.");
      return;
    }
    setBatchResults(null);
    setBatchRecipients((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        companyEmail: "",
        recruiterName: "",
        nameEdited: false,
      },
    ]);
  }

  function removeBatchRecipient(id: string) {
    if (batchRecipients.length <= 1) return;
    setBatchResults(null);
    setBatchRecipients((current) =>
      current.filter((recipient) => recipient.id !== id),
    );
  }

  const previewVariables = buildTemplateVariables({
    role: watchedValues.role?.trim() || "{{{ROLE}}}",
    company: watchedValues.company?.trim() || "{{{COMPANY}}}",
    recruiterName: batchMode
      ? batchRecipients[0]?.recruiterName || "team"
      : watchedValues.recruiterName,
    portfolio: profile?.portfolio,
    linkedin: profile?.linkedin,
    github: profile?.github,
    phone: profile?.phone,
    resumeUrl: profile?.resumeUrl,
    projectUrl1: profile?.projectUrl1,
    projectUrl2: profile?.projectUrl2,
    projectUrl3: profile?.projectUrl3,
    name: profile?.name || "{{{NAME}}}",
  });

  const previewBody = selectedTemplate
    ? renderTemplate(selectedTemplate.html, previewVariables)
    : "";

  const previewSubject = selectedTemplate
    ? renderTemplate(selectedTemplate.subject ?? "", previewVariables)
    : "";

  function onSubmit(data: ApplicationInput) {
    const scheduledAt = getValidatedScheduledAt();
    if (scheduledAt === null) return;

    void sendApplication({ ...data, scheduledAt }, () => {
      if (onSuccess) {
        onSuccess();
        handleClear();
      }
    });
  }

  function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!batchMode) {
      void handleSubmit(onSubmit)(event);
      return;
    }

    event.preventDefault();

    const scheduledAt = getValidatedScheduledAt();
    if (scheduledAt === null) return;

    const values = getValues();
    const parsed = batchApplicationSchema.safeParse({
      company: values.company,
      role: values.role,
      templateId: selectedTemplate?.id,
      scheduledAt,
      requestId: crypto.randomUUID(),
      recipients: batchRecipients.map(({ companyEmail, recruiterName }) => ({
        companyEmail,
        recruiterName,
      })),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBatchResults(null);
    sendApplicationsBatch(parsed.data, setBatchResults);
  }

  async function connectGmail() {
    try {
      const result = await linkSocial({
        provider: "google",
        scopes: [GMAIL_SEND_SCOPE],
        callbackURL: "/applications/new",
        disableRedirect: true,
      });

      const url = result.data?.url;
      if (!url) {
        toast.error("Could not start the Gmail connection. Please try again.");
        return;
      }

      const connectUrl = new URL(url);
      connectUrl.searchParams.set("prompt", "consent");
      window.location.href = connectUrl.toString();
    } catch (error) {
      console.error("[Gmail] connect failed:", error);
      toast.error("Could not connect Gmail. Please try again.");
    }
  }

  function handleGmailSend() {
    if (!gmailConnected) {
      void connectGmail();
      return;
    }

    void handleSubmit((data) => {
      sendWithGmail(data, (result) => {
        if (result.success) {
          if (onSuccess) {
            onSuccess();
            handleClear();
          }
          return;
        }
        if (result.code === "not_connected") {
          void connectGmail();
        }
      });
    })();
  }

  function changeBatchMode(enabled: boolean) {
    setBatchResults(null);
    if (
      enabled &&
      batchRecipients.length === 1 &&
      !batchRecipients[0].companyEmail.trim()
    ) {
      const values = getValues();
      if (values.companyEmail?.trim()) {
        const inferred = parseEmail(values.companyEmail);
        setBatchRecipients([
          {
            id: crypto.randomUUID(),
            companyEmail: values.companyEmail,
            recruiterName:
              values.recruiterName ||
              inferred?.recruiterName ||
              (inferred ? "team" : ""),
            nameEdited: Boolean(values.recruiterName),
          },
        ]);
      }
    }
    setBatchMode(enabled);
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

  if (templates.length === 0) {
    return (
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Template required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create at least one email template before sending applications.
              </p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => router.push("/templates")}
              >
                Create a Template
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
      {allowBatch && (
        <div className={showPreview ? "lg:col-span-2" : undefined}>
          <div
            className="inline-flex rounded-md border border-border p-1"
            role="group"
            aria-label="Application sending mode"
          >
            <Button
              type="button"
              size="sm"
              className={'text-foreground'}

              variant={batchMode ? "ghost" : "default"}
              aria-pressed={!batchMode}
              disabled={isPending}
              onClick={() => changeBatchMode(false)}
            >
              Single application
            </Button>
            <Button
              type="button"
              className={'text-foreground'}
              size="sm"
              variant={batchMode ? "default" : "ghost"}
              aria-pressed={batchMode}
              disabled={isPending}
              onClick={() => changeBatchMode(true)}
            >
              Same company, multiple people
            </Button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={onFormSubmit} className="flex flex-col gap-4">
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            {!batchMode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyEmail">Company Email *</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  placeholder="firstname.lastname@company.com"
                  {...register("companyEmail", {
                    onChange: handleEmailChange,
                  })}
                />
                {errors.companyEmail && (
                  <p className="text-xs text-destructive">
                    {errors.companyEmail.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Paste any format — name@company.com, first.last@company.in,
                  or careers@company.com — and we will fill in the fields below.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="company">Company Name *</Label>
                {batchMode && (
                  <span className="text-xs text-muted-foreground">
                    Shared across recipients
                  </span>
                )}
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
                  onChange: () => {
                    setAutoFilled((s) => ({ ...s, company: false }));
                    setBatchResults(null);
                  },
                })}
              />
              {errors.company && (
                <p className="text-xs text-destructive">
                  {errors.company.message}
                </p>
              )}
            </div>

            {batchMode && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>People to email</Label>
                    <p className="text-xs text-muted-foreground">
                      Each person gets a separate email. Up to 100 per batch;
                      recipients will not see each other.
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {batchRecipients.length} / 100
                  </span>
                </div>

                {batchRecipients.map((recipient, index) => {
                  const result = batchResults?.[index];
                  return (
                    <div
                      key={recipient.id}
                      className="flex flex-col gap-2 rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Recipient {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove recipient ${index + 1}`}
                          disabled={isPending || batchRecipients.length === 1}
                          onClick={() => removeBatchRecipient(recipient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={`batch-email-${recipient.id}`}>
                            Email *
                          </Label>
                          <Input
                            id={`batch-email-${recipient.id}`}
                            type="email"
                            placeholder="jane.doe@company.com"
                            value={recipient.companyEmail}
                            disabled={isPending}
                            onChange={(event) =>
                              updateBatchEmail(
                                recipient.id,
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={`batch-name-${recipient.id}`}>
                            Name for greeting
                          </Label>
                          <Input
                            id={`batch-name-${recipient.id}`}
                            placeholder="Team"
                            value={recipient.recruiterName}
                            disabled={isPending}
                            onChange={(event) => {
                              setBatchResults(null);
                              setBatchRecipients((current) =>
                                current.map((item) =>
                                  item.id === recipient.id
                                    ? {
                                        ...item,
                                        recruiterName: event.target.value,
                                        nameEdited: true,
                                      }
                                    : item,
                                ),
                              );
                            }}
                          />
                        </div>
                      </div>
                      {result && (
                        <p
                          className={
                            result.status !== "failed"
                              ? "text-xs text-green-600"
                              : "text-xs text-destructive"
                          }
                        >
                          {result.status === "sent"
                            ? "Accepted by Resend"
                            : result.status === "scheduled"
                              ? "Scheduled with Resend"
                              : result.error || "Failed"}
                        </p>
                      )}
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  className="self-start gap-2"
                  disabled={isPending || batchRecipients.length >= 100}
                  onClick={addBatchRecipient}
                >
                  <Plus className="h-4 w-4" />
                  Add recipient
                </Button>
                <p className="text-xs text-muted-foreground">
                  Names are suggested from email addresses when recognizable.
                  Generic addresses use “team”; you can edit each greeting.
                  Batch emails include your resume link, not an attachment.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="role">Role *</Label>
                {batchMode && (
                  <span className="text-xs text-muted-foreground">
                    Shared across recipients
                  </span>
                )}
              </div>
              <RoleCombobox
                value={watchedValues.role ?? ""}
                onChange={(val) => {
                  setValue("role", val, { shouldValidate: true });
                  setBatchResults(null);
                }}
                onBlur={() => {}}
                error={errors.role?.message}
              />
              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            {!batchMode && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="recruiterName">
                    Recruiter Name (optional)
                  </Label>
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
            )}

            {templates.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Email Template</Label>
                <select
                  className="flex h-9 w-full  border border-input bg-transparent px-3 py-1 text-sm  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedTemplate?.id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setValue("templateId", id);
                    setSelectedTemplate(
                      templates.find((t) => t.id === id) ?? null,
                    );
                    setBatchResults(null);
                  }}
                  disabled={isPending}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-sm border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Send time</Label>
                  <p className="text-xs text-muted-foreground">
                    Send now or schedule up to 30 days ahead.
                  </p>
                </div>
                <div
                  className="inline-flex rounded-md border border-border p-1"
                  role="group"
                  aria-label="Email send time"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={scheduleEnabled ? "ghost" : "default"}
                    aria-pressed={!scheduleEnabled}
                    disabled={isPending}
                    onClick={() => handleScheduleToggle(false)}
                  >
                    Send now
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={scheduleEnabled ? "default" : "ghost"}
                    aria-pressed={scheduleEnabled}
                    disabled={isPending}
                    onClick={() => handleScheduleToggle(true)}
                    className="gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Schedule
                  </Button>
                </div>
              </div>

              {scheduleEnabled && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="scheduledAt">Date and time *</Label>
                  <SchedulePresetButtons
                    value={scheduledAtLocal}
                    onChange={(value) => {
                      setScheduledAtLocal(value);
                      setBatchResults(null);
                    }}
                    disabled={isPending}
                  />
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    min={scheduleBounds.min}
                    max={scheduleBounds.max}
                    value={scheduledAtLocal}
                    disabled={isPending}
                    onChange={(event) => {
                      setScheduledAtLocal(event.target.value);
                      setBatchResults(null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {scheduledAtLocal
                      ? `${batchMode ? `${batchRecipients.length} emails` : "Email"} scheduled for ${formatScheduledAt(fromDateTimeLocalValue(scheduledAtLocal))} in your local timezone.`
                      : `Choose when ${batchMode ? "all emails" : "the email"} should be sent. Times use your local timezone.`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="flex-1 gap-2" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : scheduleEnabled ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending
              ? scheduleEnabled
                ? "Scheduling..."
                : "Sending..."
              : batchMode
                ? scheduleEnabled
                  ? `Schedule ${batchRecipients.length} Applications`
                  : `Send ${batchRecipients.length} Applications`
                : scheduleEnabled
                  ? "Schedule Application"
                  : "Send Application"}
          </Button>

          {/* button to support the sending the application through gmail  */}

          {!batchMode && !scheduleEnabled && (
            <Button
              type="button"
              className="flex-1 gap-2"
              onClick={handleGmailSend}
              disabled={isPending || isGmailPending}
            >
              {isGmailPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isGmailPending
                ? "Sending via Gmail..."
                : gmailConnected
                  ? "Send via Gmail"
                  : "Connect Gmail"}
            </Button>
          )}
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
              <p className="text-xs font-medium text-muted-foreground">
                Preview
              </p>

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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export function NewApplicationFormSkeleton() {
  return (
    <div className="grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Form Skeleton */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {/* Preview Skeleton */}
      <div className="flex flex-col gap-3">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-28" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
