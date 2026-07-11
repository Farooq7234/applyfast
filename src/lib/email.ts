import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
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
  }
): string {
  const greeting = vars.recruiterName ? `Hi ${vars.recruiterName},` : "Hi,";

  const plain = template
    .replace(/\r\n/g, "\n")
    .replace(/Hi \{\{recruiter_name\}\},/g, greeting)
    .replace(/\{\{recruiter_name\}\}/g, vars.recruiterName ?? "")
    .replace(/\{\{role\}\}/g, vars.role)
    .replace(/\{\{company\}\}/g, vars.company)
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{portfolio\}\}/g, vars.portfolio ? `<a href="${vars.portfolio}">${vars.portfolio}</a>` : "")
    .replace(/\{\{resume\}\}/g, vars.resumeUrl ? `<a href="${vars.resumeUrl}">${vars.resumeUrl}</a>` : "");

  const paragraphs = plain
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px 0;">${p.split("\n").join("<br>")}</p>`)
    .join("");

  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;">${paragraphs}</div>`;
}

export function buildEmailSubject(
  template: string,
  role: string,
  company?: string | null
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
<body style="font-family: Arial, Helvetica, sans-serif; font-size:16px; line-height:1.6; color:#222;">
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
export const TEMPLATE_COLD_SUBJECT = "Would Love to Build With Your Team";

export const TEMPLATE_COLD_BODY = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, Helvetica, sans-serif; font-size:16px; line-height:1.6; color:#222;">
  <p>Hi {{recruiter_name}},</p>

  <p>
    I know you may not have an active opening right now, but I wanted to reach
    out anyway.
  </p>

  <p><strong>Resumes tell you what someone knows. Projects tell you how they think.</strong></p>

  <p>Before anything else, I would love for you to take a quick look at my work:</p>

  <p>
    Portfolio:
    <a href="{{portfolio}}">{{portfolio}}</a><br>
    Resume:
    <a href="{{resume}}">{{resume}}</a>
  </p>

  <p>
    I enjoy building polished, production ready web applications using React,
    Next.js, Node.js, TypeScript, and PostgreSQL. I care about writing clean
    code, shipping reliable features, and creating products that people enjoy
    using.
  </p>

  <p>
    If my work resonates with what your team values, I would be grateful to be
    kept in mind for future opportunities or to have a quick chat.
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

// Legacy
export const DEFAULT_TEMPLATE_BODY = TEMPLATE_HIRING_BODY;