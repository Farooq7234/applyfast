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
