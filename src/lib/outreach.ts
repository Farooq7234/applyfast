const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const OUTREACH_TEMPLATE_ID = "cold-outreach";
export const OUTREACH_TEMPLATE_VERSION = "2.0.0";
export const OUTREACH_TEMPLATE_NAME = "Cold Outreach";
export const DAILY_OUTREACH_LIMIT = 30;

export function hasDailyOutreachQuota(authorizedAttempts: number): boolean {
  return (
    Number.isInteger(authorizedAttempts) &&
    authorizedAttempts >= 0 &&
    authorizedAttempts < DAILY_OUTREACH_LIMIT
  );
}

export type OutreachSourceApplication = {
  id: string;
  company: string;
  companyEmail: string;
  recruiterName: string | null;
  status: string;
  createdAt: Date;
};

export type OutreachCandidate = {
  sourceApplicationId: string | null;
  company: string;
  companyEmail: string;
  normalizedEmail: string;
  recruiterName: string | null;
  status: "PENDING" | "SKIPPED";
  skipReason: string | null;
  createdAt: Date;
};

export type RenderedOutreachMessage = {
  subject: string;
  html: string;
  text: string;
};

export function normalizeRecipientEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : null;
}

export function selectOutreachCandidates(
  applications: OutreachSourceApplication[],
  repliedEmails: ReadonlySet<string> = new Set(),
): OutreachCandidate[] {
  const sorted = [...applications].sort(
    (left, right) =>
      left.createdAt.getTime() - right.createdAt.getTime() ||
      left.id.localeCompare(right.id),
  );
  const groups = new Map<string, OutreachSourceApplication[]>();

  for (const application of sorted) {
    const normalized = normalizeRecipientEmail(application.companyEmail);
    const key = normalized ?? `invalid:${application.id}`;
    const group = groups.get(key) ?? [];
    group.push(application);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([normalizedEmail, group]) => {
    const first = group[0];
    const normalized = normalizeRecipientEmail(first.companyEmail);
    const deliverySuppressed = group.some(
      (application) =>
        application.status === "bounced" || application.status === "complained",
    );
    const replySuppressed = normalized !== null && repliedEmails.has(normalized);
    const invalid = normalized === null;

    return {
      sourceApplicationId: first.id,
      company: first.company,
      companyEmail: first.companyEmail.trim(),
      normalizedEmail,
      recruiterName: first.recruiterName,
      status: deliverySuppressed || replySuppressed || invalid ? "SKIPPED" : "PENDING",
      skipReason: deliverySuppressed
        ? "An application email to this address bounced or was complained about."
        : replySuppressed
          ? "This address belongs to a contact whose target company is marked as replied."
        : invalid
          ? "The application record has a missing or invalid recipient address."
          : null,
      createdAt: first.createdAt,
    };
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeProfileUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}




export function renderOutreachMessage(input: {
  company: string;
  recruiterName: string | null;
  senderName: string;
  portfolio: string | null;
  resumeUrl: string | null;
}): RenderedOutreachMessage {
  const company = input.company.trim();
  const subjectCompany = company.replace(/[\r\n\t]+/g, " ").trim();

  const greeting = input.recruiterName?.trim()
    ? `Hi ${input.recruiterName.trim()},`
    : `Hi ${company},`;

  const portfolio = safeProfileUrl(input.portfolio);
  const resume = safeProfileUrl(input.resumeUrl);

  const projects = [
    {
      name: "ApplyFast",
      url: "https://applyfast.farooqx.in",
      description:
        "Job application tracker that sends outreach emails and tracks delivery, opens, clicks and replies, built with Next.js, Prisma and Resend.",
    },
    {
      name: "TypeFast",
      url: "https://typefast-omega.vercel.app",
      description:
        "Real-time multiplayer typing game with live WPM, accuracy and leaderboards, built with Next.js and WebSockets.",
    },
    {
      name: "Quality Keeper",
      url: "https://quality-keeper.vercel.app",
      description:
        "AI media compression SaaS with a compression media files and 200+ users, built with Next.js, Prisma and Cloudinary.",
    },
  ];

  const companyIntro =
    `I came across ${company} and am impressed with the products your team is building and the way you are building them. ` +
    "I am writing to express my strong interest in any open engineering positions on your team.";

  const closing =
    `I am eager to join a forward-thinking team where I can contribute to building impactful products and grow as an engineer. ` +
    `I am confident that my technical skills would make a valuable asset to ${company}.`;

  const signature = [
    "Best regards,",
    input.senderName.trim(),
    ...(portfolio ? [portfolio] : []),
    ...(resume ? [resume] : []),
  ].join("\n");

  const text = [
    greeting,
    "",
    companyIntro,
    "",
    "Here are a few of my recent projects:",
    "",
    ...projects.map(
      (project) =>
        `- ${project.name} (${project.url}) - ${project.description}`
    ),
    "",
    closing,
    "",
    "I would love the opportunity to discuss how I can contribute to your team.",
    "",
    signature,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#222;">
      <p style="margin:0 0 16px 0;">
        ${escapeHtml(greeting)}
      </p>

      <p style="margin:0 0 16px 0;">
        ${escapeHtml(companyIntro)}
      </p>

      <p style="margin:0 0 8px 0;">
        Here are a few of my recent projects:
      </p>

      <ul style="margin:0 0 16px 0;padding-left:24px;">
        ${projects
          .map(
            (project) => `
              <li style="margin-bottom:8px;">
                <strong>${escapeHtml(project.name)}</strong>
                (<a href="${escapeHtml(project.url)}">${escapeHtml(project.url)}</a>) -
                ${escapeHtml(project.description)}
              </li>
            `
          )
          .join("")}
      </ul>

      <p style="margin:0 0 16px 0;">
        ${escapeHtml(closing)}
      </p>

      <p style="margin:0 0 16px 0;">
        I would love the opportunity to discuss how I can contribute to your team.
      </p>

      <p style="margin:0;">
        Best regards,<br>
        ${escapeHtml(input.senderName.trim())}
        ${portfolio ? `<br><a href="${escapeHtml(portfolio)}">${escapeHtml(portfolio)}</a>` : ""}
        ${resume ? `<br><a href="${escapeHtml(resume)}">${escapeHtml(resume)}</a>` : ""}
      </p>
    </div>
  `;

  return {
    subject: `Would Love to Build With ${subjectCompany}`,
    html,
    text,
  };
}



export function getUtcDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function formatUtcDate(date: Date): string {
  return getUtcDate(date).toISOString().slice(0, 10);
}

export function getDeterministicDailySummary(counts: {
  authorized: number;
  accepted: number;
  delivered: number;
  failed: number;
  skipped: number;
}): string {
  return `Today's outreach: ${counts.authorized} send attempts authorized; ${counts.accepted} accepted by the email provider; ${counts.delivered} confirmed delivered; ${counts.failed} failed or uncertain; ${counts.skipped} recipients skipped.`;
}
