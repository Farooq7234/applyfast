"use server";

import { requireSession } from "@/lib/session";
import {
  getResend,
  getResendFrom,
  plainTextToEmailHtml,
  replySubject,
} from "@/lib/email";

function extractEmailAddress(from: string): string | null {
  const angle = from.match(/<([^>]+)>/);
  const value = (angle?.[1] ?? from).trim();
  return value.includes("@") ? value : null;
}

export async function replyToReceivedEmail(
  receivedEmailId: string,
  body: string,
): Promise<{ error?: string; success?: boolean }> {
  await requireSession();

  const id = receivedEmailId.trim();
  const text = body.trim();

  if (!id) return { error: "Missing email id" };
  if (!text) return { error: "Reply cannot be empty" };

  const { data: received, error: fetchError } =
    await getResend().emails.receiving.get(id);

  if (fetchError || !received) {
    console.error("[Resend] receiving.get failed:", fetchError);
    return { error: "Could not load the original email" };
  }

  const messageId = received.message_id?.trim();
  if (!messageId) {
    return { error: "Original email is missing a message id, so it cannot be threaded" };
  }

  const to = extractEmailAddress(received.from);
  if (!to) {
    return { error: "Original email is missing a sender address" };
  }

  const { error: sendError } = await getResend().emails.send({
    from: getResendFrom(),
    to: [to],
    subject: replySubject(received.subject),
    html: plainTextToEmailHtml(text),
    headers: {
      "In-Reply-To": messageId,
      References: messageId,
    },
  });

  if (sendError) {
    console.error("[Resend] reply send failed:", sendError);
    return { error: `Email delivery failed: ${sendError.message}` };
  }

  return { success: true };
}
