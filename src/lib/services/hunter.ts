export interface EmailResult {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence?: number;
  source: "hunter";
}

export async function findEmailsByDomain(
  domain: string
): Promise<EmailResult[]> {
  const apiKey = process.env.HUNTER_API_KEY;

  if (!apiKey) {
    throw new Error("HUNTER_API_KEY is missing");
  }

  const url = new URL("https://api.hunter.io/v2/domain-search");

  url.searchParams.set("domain", domain);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Hunter API Error (${response.status}): ${error}`
    );
  }

  const json = await response.json();

  const emails = json?.data?.emails ?? [];

  return emails.map((item: any) => ({
    email: item.value,
    firstName: item.first_name,
    lastName: item.last_name,
    position: item.position,
    confidence: item.confidence,
    source: "hunter",
  }));
}