# ApplyFast

Apply to software engineering jobs in under 15 seconds.

## Stack

- **Next.js 16** App Router
- **Better Auth** (email/password auth)
- **Prisma 7** + **Neon PostgreSQL**
- **Resend** (email sending)
- **shadcn/ui** + **Tailwind CSS**
- **React Hook Form** + **Zod**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your values:

```bash
DATABASE_URL="postgresql://..."         # Neon connection string
BETTER_AUTH_SECRET="..."                # Random 32+ char secret
BETTER_AUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="..."                  # GitHub OAuth app credentials
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."                  # Google OAuth client credentials
GOOGLE_CLIENT_SECRET="..."
RESEND_API_KEY="re_..."                 # From resend.com
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For Google sign-in, configure the OAuth client's authorized redirect URI as
`<BETTER_AUTH_URL>/api/auth/callback/google` in Google Cloud Console.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 4. Start development server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000)

## Features

- **Auth** — Sign up, sign in, sign out with Better Auth
- **Profile** — Set name, portfolio, LinkedIn, GitHub, resume URL once
- **New Application** — Send one application or batch up to 100 separate, personalized emails to contacts at the same company; inferred greetings are editable
- **Applications table** — View, resend, delete all applications with search
- **Email templates** — Default template with `{{role}}`, `{{company}}`, `{{name}}` etc.
- **Dashboard** — Stats cards (total, sent today, failed, pending follow-ups)
- **Follow-up cron** — `GET /api/follow-up` endpoint for automated follow-ups

## Prisma migration

```bash
# Initial migration
npx prisma migrate dev --name init

# After schema changes
npx prisma migrate dev --name <description>

# Generate client only
npx prisma generate
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all env vars in Vercel project settings
4. Deploy

For the follow-up cron, use Vercel Cron Jobs to call `GET /api/follow-up` with `Authorization: Bearer <CRON_SECRET>`.
