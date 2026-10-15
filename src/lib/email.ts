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

export const DEFAULT_TEMPLATE_SUBJECT = "Application for {{role}}";

// Template 1: Company is actively hiring for a specific role
export const TEMPLATE_HIRING_NAME = "Active Opening";
export const TEMPLATE_HIRING_SUBJECT =
  "Application for {{role}} at {{company}}";

export const TEMPLATE_HIRING_BODY = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#222;">
  <p>Hi {{recruiter_name}},</p>

  <p>I came across your opening for the <strong>{{role}}</strong> role and wanted to reach out.</p>

  <p><strong>Resumes tell you what someone knows. Projects tell you how they think.</strong></p>

  <p>Before anything else, I would love for you to take a quick look at my work:</p>

  <p>
    Portfolio:
    <a href="{{portfolio}}">{{portfolio}}</a><br>
    Resume:
    <a href="{{resume}}">{{resume}}</a>
  </p>

  <p>
    I believe great software is built by people who care about the details.
    That is the mindset I bring to every project, whether I am designing the
    user experience, building backend systems, or solving problems that make
    a product better.
  </p>

  <p>
    If my work resonates with what your team is looking for, I would be
    grateful for the opportunity to chat.
  </p>

  <p>
    Thank you for your time, and I look forward to hearing from you.
  </p>

  <p>
    Best regards,<br>
    {{name}}
  </p>
</body>
</html>
`;

// Template 2: Company is NOT actively hiring (cold outreach)
export const TEMPLATE_COLD_NAME = "Cold Outreach";
export const TEMPLATE_COLD_SUBJECT = `Excited to Explore Engineering Opportunities at {{company}}`;

export const TEMPLATE_COLD_BODY = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#222;">

  <p style="margin-bottom:20px;">
    <strong>TL;DR:</strong> I am passionate about the work {{company}} is doing. I have hands-on experience building full stack applications and would love to contribute to a focused team building great products.
  </p>

  <p>Hi {{recruiter_name}},</p>

  <p>
    I came across {{company}} and was impressed by the products your team is building and the way you are building them. I am reaching out to express my interest in any open engineering positions on your team.
  </p>

  <p><strong>Here are a few of my recent projects:</strong></p>

  <ul style="padding-left:20px; margin:12px 0 20px;">
    <li style="margin-bottom:12px;">
      <strong>
        <a href="https://applyfast.farooqx.in" style="color:#2563eb; text-decoration:none;">ApplyFast</a>
      </strong>
      <br>
      A job application tracker that sends outreach emails and tracks delivery, opens, clicks and replies. Built with Next.js, Prisma and Resend.
    </li>

    <li style="margin-bottom:12px;">
      <strong>
        <a href="https://typefast-omega.vercel.app" style="color:#2563eb; text-decoration:none;">TypeFast</a>
      </strong>
      <br>
      A real time multiplayer typing game featuring live WPM, accuracy tracking and leaderboards. Built with Next.js and WebSockets.
    </li>

    <li style="margin-bottom:12px;">
      <strong>
        <a href="https://quality-keeper.vercel.app" style="color:#2563eb; text-decoration:none;">Quality Keeper</a>
      </strong>
      <br>
      An AI powered media compression SaaS with a 60% compression ratio and 200+ users. Built with Next.js, Prisma and Cloudinary.
    </li>
  </ul>

  <p>
    I am looking for a team where I can contribute to building impactful products, take ownership and grow as an engineer. I believe my hands on experience could be valuable to {{company}}.
  </p>

  <p>
    I would love to connect and discuss how I could contribute to your team.
  </p>

  <p style="margin-top:24px;">
    Best regards,<br>
    <strong>{{name}}</strong><br>
    <a href="{{portfolio}}" style="color:#2563eb; text-decoration:none;">Portfolio</a>
    &nbsp;|&nbsp;
    <a href="{{resume}}" style="color:#2563eb; text-decoration:none;">Resume</a>
  </p>

</body>
</html>

`;

// Legacy
export const DEFAULT_TEMPLATE_BODY = TEMPLATE_HIRING_BODY;
