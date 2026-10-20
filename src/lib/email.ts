import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const DEFAULT_RESEND_FROM = "Umar Farooq <contact@farooqx.in>";

export function getResendFrom(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_RESEND_FROM;
}

export function plainTextToEmailHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const paragraphs = escaped
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) => `<p style="margin:0 0 16px 0;">${p.split("\n").join("<br>")}</p>`,
    )
    .join("");

  return `<div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5">${paragraphs}</div>`;
}

export function replySubject(
  originalSubject: string | null | undefined,
): string {
  const subject = originalSubject?.trim() || "";
  if (!subject) return "Re:";
  if (/^re:\s/i.test(subject) || /^re:$/i.test(subject)) return subject;
  return `Re: ${subject}`;
}

export function buildEmailBody(
  template: string,
  vars: {
    role: string;
    company: string;
    recruiterName?: string | null;
    portfolio?: string | null;
    resumeUrl?: string | null;
    name: string;
  },
): string {
  const greeting = vars.recruiterName ? `Hi ${vars.recruiterName},` : "Hi,";

  const normalizedTemplate = template.replace(
    /(<body\b[^>]*\bstyle\s*=\s*["'][^"']*)font-size\s*:\s*16px/gi,
    "$1font-size:14px",
  );

  const plain = normalizedTemplate
    .replace(/\r\n/g, "\n")
    .replace(/Hi \{\{recruiter_name\}\},/g, greeting)
    .replace(/\{\{recruiter_name\}\}/g, vars.recruiterName ?? "")
    .replace(/\{\{role\}\}/g, vars.role)
    .replace(/\{\{company\}\}/g, vars.company)
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(
      /\{\{portfolio\}\}/g,
      vars.portfolio ? `<a href="${vars.portfolio}">${vars.portfolio}</a>` : "",
    )
    .replace(
      /\{\{resume\}\}/g,
      vars.resumeUrl ? `<a href="${vars.resumeUrl}">${vars.resumeUrl}</a>` : "",
    );

  const paragraphs = plain
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) => `<p style="margin:0 0 16px 0;">${p.split("\n").join("<br>")}</p>`,
    )
    .join("");

  return `<div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5">${paragraphs}</div>`;
}

export function buildEmailSubject(
  template: string,
  role: string,
  company?: string | null,
): string {
  return template
    .replace(/\{\{role\}\}/g, role)
    .replace(/\{\{company\}\}/g, company ?? "");
}
