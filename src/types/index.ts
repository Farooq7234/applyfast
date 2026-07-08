export type ApplicationStatus = "sent" | "failed" | "pending";

export interface User {
  id: string;
  name: string;
  email: string;
  portfolio: string | null;
  linkedin: string | null;
  github: string | null;
  phone: string | null;
  resumeUrl: string | null;
  createdAt: Date;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  companyEmail: string;
  role: string;
  recruiterName: string | null;
  subject: string;
  body: string;
  status: ApplicationStatus;
  followUpDate: Date | null;
  followUpSent: boolean;
  createdAt: Date;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

export interface DashboardStats {
  total: number;
  sentToday: number;
  failed: number;
  pendingFollowUps: number;
}
