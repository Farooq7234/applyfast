export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export function hasGmailSendScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  return scope.split(/[\s,]+/).includes(GMAIL_SEND_SCOPE);
}
