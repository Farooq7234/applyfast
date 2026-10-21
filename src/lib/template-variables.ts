export const TEMPLATE_VARIABLE_KEYS = [
  "RECRUITER_NAME",
  "ROLE",
  "COMPANY",
  "PORTFOLIO",
  "LINKEDIN",
  "GITHUB",
  "PHONE",
  "RESUME",
  "PROJECT_1",
  "PROJECT_2",
  "PROJECT_3",
  "NAME",
] as const;

export const TEMPLATE_VARIABLE_TOKENS = TEMPLATE_VARIABLE_KEYS.map(
  (key) => `{{{${key}}}}`,
);

type TemplateVariableKey = (typeof TEMPLATE_VARIABLE_KEYS)[number];

export type TemplateVariableValues = Record<string, string>;

export type UserTemplate = {
  id: string;
  name: string;
  subject: string | null;
  html: string;
  status: "draft" | "published";
  alias: string | null;
  updatedAt: string;
};

export function buildTemplateVariables(input: {
  role: string;
  company: string;
  recruiterName?: string | null;
  portfolio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  phone?: string | null;
  resumeUrl?: string | null;
  projectUrl1?: string | null;
  projectUrl2?: string | null;
  projectUrl3?: string | null;
  name: string;
}): TemplateVariableValues {
  return {
    ROLE: input.role,
    COMPANY: input.company,
    RECRUITER_NAME: input.recruiterName?.trim() || "there",
    PORTFOLIO: input.portfolio ?? "",
    LINKEDIN: input.linkedin ?? "",
    GITHUB: input.github ?? "",
    PHONE: input.phone ?? "",
    RESUME: input.resumeUrl ?? "",
    PROJECT_1: input.projectUrl1 ?? "",
    PROJECT_2: input.projectUrl2 ?? "",
    PROJECT_3: input.projectUrl3 ?? "",
    NAME: input.name,
  };
}

export function renderTemplate(
  source: string,
  variables: TemplateVariableValues,
): string {
  const replace = (_match: string, key: string) =>
    variables[key as TemplateVariableKey] ?? "";

  return source
    .replace(/\{\{\{\s*([A-Z0-9_]+)\s*\}\}\}/g, replace)
    .replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, replace);
}
