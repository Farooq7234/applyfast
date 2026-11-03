import { GMAIL_SEND_SCOPE } from "@/lib/gmail-scopes";

const GMAIL_SEND_ENDPOINT =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

const BASE64_LINE_LENGTH = 76;

export class GmailApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GmailApiError";
    this.status = status;
  }
}

function sanitizeHeader(value: string, field: string): string {
  const cleaned = value.replace(/[\r\n]+/g, " ").trim();
  if (!cleaned) {
    throw new Error(`${field} cannot be empty`);
  }
  return cleaned;
}

function encodeHeaderValue(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(value: string): string {
  const lines: string[] = [];
  for (let index = 0; index < value.length; index += BASE64_LINE_LENGTH) {
    lines.push(value.slice(index, index + BASE64_LINE_LENGTH));
  }
  return lines.join("\r\n");
}

export function buildGmailRawMessage({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): string {
  const recipient = sanitizeHeader(to, "Recipient");
  const subjectValue = encodeHeaderValue(
    sanitizeHeader(subject || "(no subject)", "Subject"),
  );
  const body = wrapBase64(Buffer.from(html, "utf8").toString("base64"));

  const mime = [
    `To: ${recipient}`,
    `Subject: ${subjectValue}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(mime, "utf8").toString("base64url");
}

export async function sendGmailMessage({
  accessToken,
  to,
  subject,
  html,
}: {
  accessToken: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const response = await fetch(GMAIL_SEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: buildGmailRawMessage({ to, subject, html }),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Gmail API request failed (${response.status})`;
    try {
      const data = (await response.json()) as {
        error?: { message?: string };
      };
      if (data.error?.message) message = data.error.message;
    } catch {
      // Keep the generic status message when the body is not JSON.
    }
    throw new GmailApiError(message, response.status);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Gmail did not return a message id");
  }

  return { id: data.id };
}

export { GMAIL_SEND_SCOPE };
