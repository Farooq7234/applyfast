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
