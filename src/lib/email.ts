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
  const greeting = vars.recruiterName
    ? `Hi ${vars.recruiterName},`
    : "Hi,";

  return template
    .replace(/Hi \{\{recruiter_name\}\},/g, greeting)
    .replace(/\{\{recruiter_name\}\}/g, vars.recruiterName ?? "")
    .replace(/\{\{role\}\}/g, vars.role)
    .replace(/\{\{company\}\}/g, vars.company)
    .replace(/\{\{portfolio\}\}/g, vars.portfolio ?? "")
    .replace(/\{\{resume\}\}/g, vars.resumeUrl ?? "")
    .replace(/\{\{name\}\}/g, vars.name);
}

export function buildEmailSubject(template: string, role: string, company?: string | null): string {
  return template
    .replace(/\{\{role\}\}/g, role)
    .replace(/\{\{company\}\}/g, company ?? "");
}

export const DEFAULT_TEMPLATE_SUBJECT = "Application for {{role}}";

// Template 1: Company is actively hiring for a specific role
export const TEMPLATE_HIRING_NAME = "Active Opening";
export const TEMPLATE_HIRING_SUBJECT = "Application for {{role}} at {{company}}";
export const TEMPLATE_HIRING_BODY = `Hi {{recruiter_name}},

I came across your opening for the {{role}} role and wanted to reach out.

Resumes tell you what someone knows. Projects tell you how they think.

Before anything else, I would love for you to take a quick look at my work:

Portfolio: {{portfolio}}
Resume: {{resume}}

I believe great software is built by people who care about the details. That is the mindset I bring to every project, whether I am designing the user experience, building backend systems, or solving problems that make a product better.
If my work resonates with what your team is looking for, I would be grateful for the opportunity to chat.

Thank you for your time, and I look forward to hearing from you.

Best regards,

{{name}}`;

// Template 2: Company is NOT actively hiring (cold outreach)
export const TEMPLATE_COLD_NAME = "Cold Outreach";
export const TEMPLATE_COLD_SUBJECT = "Would Love to Build With Your Team";
export const TEMPLATE_COLD_BODY = `Hi {{recruiter_name}},

I know you may not have an active opening right now, but I wanted to reach out anyway.

Resumes tell you what someone knows. Projects tell you how they think.

Before anything else, I would love for you to take a quick look at my work:

Portfolio: {{portfolio}}
Resume: {{resume}}

I enjoy building polished, production-ready web applications using React, Next.js, Node.js, TypeScript, and PostgreSQL. I care about writing clean code, shipping reliable features, and creating products that people enjoy using.

If my work resonates with what your team values, I would be grateful to be kept in mind for future opportunities or to have a quick chat.

Thank you for your time, and I look forward to hearing from you.

Best regards,

{{name}}`;

// Legacy — kept so existing code doesn't break
export const DEFAULT_TEMPLATE_BODY = TEMPLATE_HIRING_BODY;
