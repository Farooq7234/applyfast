import { Resend } from "resend";
import type { AttachmentData } from "resend";
import { format } from "date-fns";
import { ArrowLeft, Paperclip, Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

async function getEmail(id: string) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { data, error } = await resend.emails.receiving.get(id);
  if (error || !data) return null;
  return data;
}

async function getAttachments(emailId: string): Promise<AttachmentData[]> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { data, error } = await resend.emails.receiving.attachments.list({
    emailId,
  });
  if (error || !data) return [];
  return data.data ?? [];
}

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [email, attachments] = await Promise.all([
    getEmail(id),
    getAttachments(id),
  ]);

  if (!email) notFound();

  const date = new Date(email.created_at);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl">
      {/* Back */}
      <Link href="/receive-emails">
        <Button variant="default" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Button>
      </Link>

      {/* Email card */}
      <Card>
        <CardContent className="pt-5 flex flex-col gap-4">
          {/* Subject */}
          <h2 className="text-lg font-semibold leading-snug">
            {email.subject || (
              <span className="italic text-muted-foreground">(no subject)</span>
            )}
          </h2>

          <Separator />

          {/* Metadata */}
          <div className="flex flex-col gap-2 text-sm">
            <MetaRow label="From" value={email.from} />
            <MetaRow label="To" value={email.to.join(", ")} />
            {email.cc && email.cc.length > 0 && (
              <MetaRow label="CC" value={email.cc.join(", ")} />
            )}
            {email.bcc && email.bcc.length > 0 && (
              <MetaRow label="BCC" value={email.bcc.join(", ")} />
            )}
            {email.reply_to && email.reply_to.length > 0 && (
              <MetaRow label="Reply-To" value={email.reply_to.join(", ")} />
            )}
            <MetaRow label="Date" value={format(date, "PPpp")} />
          </div>

          <Separator />

          {/* Body — prefer HTML, fall back to plain text */}
          <div>
            {email.html ? (
              <iframe
                srcDoc={email.html}
                sandbox="allow-same-origin"
                className="w-full min-h-[400px] rounded-md border border-border bg-white"
                title="Email content"
              />
            ) : email.text ? (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-sans">
                {email.text}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No body content
              </p>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Attachments ({attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.filename ?? true}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-auto py-1.5"
                      >
                        <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="max-w-[200px] truncate">
                          {att.filename ?? "Attachment"}
                        </span>
                        {att.size > 0 && (
                          <span className="text-muted-foreground text-xs">
                            ({formatBytes(att.size)})
                          </span>
                        )}
                        <Download className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      </Button>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-20 flex-shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
