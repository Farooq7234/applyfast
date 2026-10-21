import { z } from "zod";
import { getScheduledAtError } from "@/lib/scheduling";

export const requiredScheduledAtSchema = z
  .string()
  .trim()
  .superRefine((value, context) => {
    const error = getScheduledAtError(value);
    if (error) {
      context.addIssue({ code: "custom", message: error });
    }
  });

export const scheduledAtSchema = requiredScheduledAtSchema.optional();

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  portfolio: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  linkedin: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  github: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  phone: z.string().optional(),
  projectUrl1: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  projectUrl2: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  projectUrl3: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const applicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  recruiterName: z.string().optional(),
  templateId: z.string().min(1, "Select a template"),
  scheduledAt: scheduledAtSchema,
});

export const batchApplicationSchema = z
  .object({
    company: z.string().trim().min(1, "Company name is required"),
    role: z.string().trim().min(1, "Role is required"),
    templateId: z.string().min(1, "Select a template"),
    scheduledAt: scheduledAtSchema,
    requestId: z.string().uuid("Invalid batch request"),
    recipients: z
      .array(
        z.object({
          companyEmail: z.string().trim().email("Enter a valid recipient email"),
          recruiterName: z.string().trim().optional(),
        }),
      )
      .min(1, "Add at least one recipient")
      .max(100, "Resend allows up to 100 emails per batch"),
  })
  .superRefine((data, context) => {
    const seenEmails = new Set<string>();
    data.recipients.forEach((recipient, index) => {
      const normalizedEmail = recipient.companyEmail.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        context.addIssue({
          code: "custom",
          message: "Each recipient email must be unique",
          path: ["recipients", index, "companyEmail"],
        });
      }
      seenEmails.add(normalizedEmail);
    });
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type BatchApplicationInput = z.infer<typeof batchApplicationSchema>;

export const TARGET_STATUSES = [
  "RESEARCHING",
  "CONTACT_FOUND",
  "EMAILED",
  "REPLIED",
  "INTERVIEWING",
  "REJECTED",
  "GHOSTED",
] as const;

export type TargetStatusValue = (typeof TARGET_STATUSES)[number];

const optionalText = z.string().optional().nullable();

const contactEmails = z
  .array(z.string().trim().email("Enter a valid email address"))
  .max(20, "Keep it to 20 emails or fewer")
  .optional();

export const createTargetSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(120),
  website: z.string().min(1, "Website is required"),
  careersUrl: optionalText,
  location: optionalText,
  contactEmails,
  status: z.enum(TARGET_STATUSES).optional(),
});

export const updateTargetSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  website: z.string().min(1).optional(),
  careersUrl: optionalText,
  location: optionalText,
  contactEmails,
  status: z.enum(TARGET_STATUSES).optional(),
});

export type CreateTargetInput = z.infer<typeof createTargetSchema>;
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;

