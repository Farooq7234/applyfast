export function normalizeWebsite(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Website is required");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  const url = new URL(withProtocol);
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  let href = url.toString();
  if (url.pathname === "/" && !url.search) {
    href = href.replace(/\/$/, "");
  }

  return href;
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
