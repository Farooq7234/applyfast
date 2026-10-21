const COMMON_SUBDOMAINS = new Set([
  "www",
  "careers",
  "career",
  "jobs",
  "job",
  "apply",
  "hire",
  "hiring",
  "recruiting",
  "recruitment",
  "talent",
  "boards",
  "board",
  "join",
  "work",
]);

const MULTIPART_SUFFIXES = new Set(["co", "com", "org", "net", "ac", "gov", "edu"]);

const JOB_BOARD_HOSTS = [
  "lever.co",
  "greenhouse.io",
  "ashbyhq.com",
  "workable.com",
  "smartrecruiters.com",
  "recruitee.com",
  "bamboohr.com",
  "jobvite.com",
  "icims.com",
  "taleo.net",
  "myworkdayjobs.com",
  "workday.com",
  "breezy.hr",
  "teamtailor.com",
  "wellfound.com",
  "angel.co",
  "instahyre.com",
  "naukri.com",
  "linkedin.com",
  "ycombinator.com",
];

function parseUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function prettify(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isJobBoardHost(host: string): boolean {
  return JOB_BOARD_HOSTS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

function nameFromJobBoard(url: URL, host: string): string | null {
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
    const index = segments.findIndex((segment) =>
      ["company", "school"].includes(segment.toLowerCase()),
    );
    const candidate = index >= 0 ? segments[index + 1] : segments[0];
    return candidate ? prettify(candidate) : null;
  }

  const skip = new Set([
    "jobs",
    "job",
    "careers",
    "career",
    "company",
    "companies",
    "boards",
    "board",
    "en",
    "us",
    "in",
  ]);
  const candidate = segments.find((segment) => !skip.has(segment.toLowerCase()));
  return candidate ? prettify(candidate) : null;
}

export function companyNameFromUrl(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (isJobBoardHost(host)) {
    return nameFromJobBoard(url, host);
  }

  const labels = host.split(".");
  while (labels.length > 2 && COMMON_SUBDOMAINS.has(labels[0])) {
    labels.shift();
  }

  if (labels.length === 0) return null;

  let label = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
  if (
    labels.length >= 3 &&
    label.length === 2 &&
    MULTIPART_SUFFIXES.has(label)
  ) {
    label = labels[labels.length - 3];
  }

  return label ? prettify(label) : null;
}

export function websiteFromUrl(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (isJobBoardHost(host)) return null;

  const labels = host.split(".");
  while (labels.length > 2 && COMMON_SUBDOMAINS.has(labels[0])) {
    labels.shift();
  }

  if (labels.length === 0) return null;
  return `https://${labels.join(".")}`;
}

export function looksLikeCareersUrl(raw: string): boolean {
  const url = parseUrl(raw);
  if (!url) return false;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (isJobBoardHost(host)) return true;

  const firstLabel = host.split(".")[0];
  if (COMMON_SUBDOMAINS.has(firstLabel) && firstLabel !== "www") {
    return true;
  }

  return /\/(careers?|jobs?|apply|positions?|openings?)(\/|$)/i.test(
    url.pathname,
  );
}
