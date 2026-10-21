import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export function getResendFrom(): string {
  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    throw new Error("RESEND_FROM is not set");
  }
  return from;
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
