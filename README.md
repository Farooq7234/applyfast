# ApplyFast

Apply to software engineering jobs in under 15 seconds.

## Stack

- **Next.js 16** App Router
- **Better Auth** (email/password auth)
- **Prisma** + **Neon PostgreSQL**
- **Resend** (email sending)
- **React Email** (daily outreach report)
- **shadcn/ui** + **Tailwind CSS**
- **React Hook Form** + **Zod**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
DATABASE_URL="postgresql://..."         # Neon connection string
BETTER_AUTH_SECRET="..."                # Random 32+ char secret
BETTER_AUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
RESEND_API_KEY="re_..."
RESEND_WEBHOOK_SECRET="whsec_..."       # Resend webhook signing secret
CRON_SECRET="..."                       # Long random secret for the daily Cron
GEMINI_API_KEY="..."                    # Gemini daily summary; fallback is deterministic
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For Google sign-in, configure the OAuth client's authorized redirect URI as
`<BETTER_AUTH_URL>/api/auth/callback/google` in Google Cloud Console.

### 3. Apply database migrations

For local development, run:

```bash
npx prisma migrate dev
```

For deployments, apply checked-in migrations with:

```bash
npx prisma migrate deploy
```

### 4. Start development server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Features

- **Auth** — Sign up, sign in, and sign out with Better Auth
- **Profile** — Store name, portfolio, LinkedIn, GitHub, phone, up to 3 project URLs, and resume URL
- **Applications** — Send applications individually or in personalized batches
- **Applications table** — Search, view, resend, and delete application records
- **Email templates** — Use Resend templates with variables such as `{{{ROLE}}}`, `{{{COMPANY}}}`, `{{{LINKEDIN}}}`, and `{{{NAME}}}`; optional fields like `{{{GITHUB}}}`, `{{{PHONE}}}`, and `{{{PROJECT_1}}}` disappear when empty
- **Dashboard** — Application, delivery, and follow-up statistics
- **Daily outreach** — Review a queue sourced from existing application contacts; automatically send up to 15 cold outreach attempts per user per UTC day
- **Outreach controls** — Preview the personalized company/recruiter email, enable or pause automation, skip contacts, and inspect outcomes
- **Daily outreach report** — Gemini summarizes persisted activity (with a deterministic fallback); a responsive React Email digest is sent through Resend to the account email

## Daily follow-up and outreach Cron

The existing Vercel Cron in `vercel.json` calls `/api/cron/follow-up` daily at 04:00 UTC. Do not add another Cron for outreach. The existing job processes application follow-ups and then each opted-in outreach campaign.

Configure `CRON_SECRET` in Vercel. Vercel sends it as `Authorization: Bearer <CRON_SECRET>`. The endpoint fails closed if the secret is missing or invalid. Existing application follow-ups continue if outreach or report processing fails.

Open **Outreach** and inspect the personalized previews before enabling automatic sending. The campaign is paused by default. Once enabled, the daily job selects the oldest eligible untouched application contacts first, collapses duplicate addresses case-insensitively, and authorizes no more than 15 sends per user per UTC date. Failed sends still count toward that date's quota; retrying a known failure consumes another slot if available. Unknown outcomes must be checked in Resend first; within 23 hours, a confirmed retry reuses the original provider idempotency key and reservation. Older unknowns cannot be automatically retried.

Invalid/missing addresses and addresses associated with a bounced or complained-about application are skipped. Contacts whose exact email address is present in a target company marked **Replied** are also suppressed. Other received replies are not reliably linked to application contacts; manually skip recipients who replied or asked not to be contacted.

Users who open the Outreach page have a persisted campaign record and receive one daily report at the verified account email, including when the campaign is paused or no contacts are sent. Report delivery issues appear in the dashboard. The daily notification does not consume the outreach quota.

## Verification

Run targeted outreach unit tests with:

```bash
npm test
```

Run linting and a production build with:

```bash
npm run lint
npm run build
```

Use cold outreach only in compliance with applicable email and privacy laws, and honor requests not to be contacted.
