import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  portfolio: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  linkedin: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  github: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  phone: z.string().optional(),
});

export const applicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  recruiterName: z.string().optional(),
  templateId: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
