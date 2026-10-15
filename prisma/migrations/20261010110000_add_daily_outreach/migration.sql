CREATE TYPE "OutreachRecipientStatus" AS ENUM (
  'PENDING',
  'CLAIMED',
  'ACCEPTED',
  'DELIVERED',
  'FAILED',
  'UNKNOWN',
  'SKIPPED'
);

CREATE TYPE "OutreachAttemptStatus" AS ENUM (
  'AUTHORIZED',
  'ACCEPTED',
  'DELIVERED',
  'FAILED',
  'UNKNOWN'
);

CREATE TYPE "OutreachReportStatus" AS ENUM (
  'PENDING',
  'SENDING',
  'ACCEPTED',
  'DELIVERED',
  'FAILED',
  'UNKNOWN'
);

CREATE TABLE "OutreachCampaign" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutreachCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutreachRecipient" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceApplicationId" TEXT,
  "company" TEXT NOT NULL,
  "companyEmail" TEXT NOT NULL,
  "normalizedEmail" TEXT NOT NULL,
  "recruiterName" TEXT,
  "status" "OutreachRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "claimedAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "skipReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutreachRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutreachSendAttempt" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "usageDate" DATE NOT NULL,
  "status" "OutreachAttemptStatus" NOT NULL DEFAULT 'AUTHORIZED',
  "templateId" TEXT NOT NULL,
  "templateVersion" TEXT NOT NULL,
  "templateName" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "failureReason" TEXT,
  "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "OutreachSendAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutreachDailyUsage" (
  "userId" TEXT NOT NULL,
  "usageDate" DATE NOT NULL,
  "authorizedAttempts" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutreachDailyUsage_pkey" PRIMARY KEY ("userId", "usageDate")
);

CREATE TABLE "OutreachDailyReport" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reportDate" DATE NOT NULL,
  "status" "OutreachReportStatus" NOT NULL DEFAULT 'PENDING',
  "summary" TEXT,
  "notificationEmail" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "providerMessageId" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "failureReason" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutreachDailyReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OutreachCampaign_userId_key" ON "OutreachCampaign"("userId");
CREATE UNIQUE INDEX "OutreachRecipient_campaignId_normalizedEmail_key"
  ON "OutreachRecipient"("campaignId", "normalizedEmail");
CREATE INDEX "OutreachRecipient_userId_status_createdAt_idx"
  ON "OutreachRecipient"("userId", "status", "createdAt");
CREATE INDEX "OutreachRecipient_campaignId_status_createdAt_idx"
  ON "OutreachRecipient"("campaignId", "status", "createdAt");
CREATE UNIQUE INDEX "OutreachSendAttempt_providerMessageId_key"
  ON "OutreachSendAttempt"("providerMessageId");
CREATE INDEX "OutreachSendAttempt_userId_usageDate_idx"
  ON "OutreachSendAttempt"("userId", "usageDate");
CREATE INDEX "OutreachSendAttempt_recipientId_authorizedAt_idx"
  ON "OutreachSendAttempt"("recipientId", "authorizedAt");
CREATE INDEX "OutreachSendAttempt_status_authorizedAt_idx"
  ON "OutreachSendAttempt"("status", "authorizedAt");
CREATE INDEX "OutreachDailyUsage_usageDate_idx" ON "OutreachDailyUsage"("usageDate");
CREATE UNIQUE INDEX "OutreachDailyReport_providerMessageId_key"
  ON "OutreachDailyReport"("providerMessageId");
CREATE UNIQUE INDEX "OutreachDailyReport_idempotencyKey_key"
  ON "OutreachDailyReport"("idempotencyKey");
CREATE UNIQUE INDEX "OutreachDailyReport_userId_reportDate_key"
  ON "OutreachDailyReport"("userId", "reportDate");
CREATE INDEX "OutreachDailyReport_status_reportDate_idx"
  ON "OutreachDailyReport"("status", "reportDate");

ALTER TABLE "OutreachCampaign"
  ADD CONSTRAINT "OutreachCampaign_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutreachRecipient"
  ADD CONSTRAINT "OutreachRecipient_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OutreachRecipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OutreachRecipient_sourceApplicationId_fkey"
  FOREIGN KEY ("sourceApplicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OutreachSendAttempt"
  ADD CONSTRAINT "OutreachSendAttempt_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OutreachSendAttempt_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "OutreachRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OutreachSendAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutreachDailyUsage"
  ADD CONSTRAINT "OutreachDailyUsage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutreachDailyReport"
  ADD CONSTRAINT "OutreachDailyReport_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OutreachDailyReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
