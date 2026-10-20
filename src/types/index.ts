export type ApplicationStatus =
  | "scheduled"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "delivery_delayed"
  | "bounced"
  | "complained"
  | "failed"
  | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  portfolio: string | null;
  linkedin: string | null;
  github: string | null;
  phone: string | null;
  resumeUrl: string | null;
  projectUrl1: string | null;
  projectUrl2: string | null;
  projectUrl3: string | null;
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
  scheduledAt: Date | null;
  sentAt: Date | null;
  followUpDate: Date | null;
  followUpSent: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  total: number;
  sentToday: number;
  failed: number;
  pendingFollowUps: number;
}

export interface ResendUsageEmailPeriod {
  used: number;
  limit: number | null;
  sent: number;
  received: number;
  resets_at: string;
}

export interface ResendUsage {
  emails: {
    daily: ResendUsageEmailPeriod;
    monthly: ResendUsageEmailPeriod;
  };
  contacts: {
    used: number;
    limit: number;
  };
  segments: {
    used: number;
    limit: number | null;
  };
  broadcasts: {
    used: number;
    limit: null;
  };
  ai_credits: {
    used: number;
    limit: number | null;
    next_increase_at: string | null;
  };
  automation_runs: {
    used: number;
    limit: number;
    resets_at: string;
  };
  domains: {
    used: number;
    limit: number | null;
  };
  rate_limit: {
    limit: number;
    duration: string;
  };
}

export interface ResendUsageResult {
  usage: ResendUsage | null;
  error: string | null;
  fetchedAt: string | null;
}
