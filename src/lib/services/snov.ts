export interface EmailResult {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence?: number;
  source: "snov";
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getSnovToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch("https://api.snov.io/v1/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.SNOV_CLIENT_ID,
      client_secret: process.env.SNOV_CLIENT_SECRET,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with Snov");
  }

  const data = await response.json();

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken!;
}

export async function findEmailsByDomain(
  domain: string
): Promise<EmailResult[]> {
  const token = await getSnovToken();

  const response = await fetch(
   `https://api.snov.io/v2/domain-emails-with-info?domain=${encodeURIComponent(
    domain
  )}&type=all&limit=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Snov API Error (${response.status}): ${error}`);
  }

  const json = await response.json();

  const emails = json.emails ?? [];

  return emails.map((item: any) => ({
    email: item.email,
    firstName: item.firstName,
    lastName: item.lastName,
    position: item.position,
    confidence: undefined,
    source: "snov",
  }));
}