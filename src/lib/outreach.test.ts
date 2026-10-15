import assert from "node:assert/strict";
import test from "node:test";
import {
  DAILY_OUTREACH_LIMIT,
  getDeterministicDailySummary,
  getUtcDate,
  hasDailyOutreachQuota,
  renderOutreachMessage,
  selectOutreachCandidates,
} from "./outreach";
import { renderDailyOutreachEmail } from "./outreach-report-email";

const date = new Date("2026-10-10T04:00:00.000Z");

test("selects the oldest record once per normalized recipient address", () => {
  const candidates = selectOutreachCandidates([
    {
      id: "newer",
      company: "Newer Co",
      companyEmail: "Recruiter@Example.com ",
      recruiterName: "New Contact",
      status: "sent",
      createdAt: date,
    },
    {
      id: "older",
      company: "Older Co",
      companyEmail: "recruiter@example.com",
      recruiterName: "Old Contact",
      status: "sent",
      createdAt: new Date("2026-10-09T04:00:00.000Z"),
    },
  ]);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].sourceApplicationId, "older");
  assert.equal(candidates[0].company, "Older Co");
  assert.equal(candidates[0].normalizedEmail, "recruiter@example.com");
  assert.equal(candidates[0].status, "PENDING");
});

test("suppresses invalid recipients and addresses with a bounce or complaint", () => {
  const candidates = selectOutreachCandidates([
    {
      id: "invalid",
      company: "Invalid Co",
      companyEmail: "not-an-email",
      recruiterName: null,
      status: "sent",
      createdAt: date,
    },
    {
      id: "valid",
      company: "Valid Co",
      companyEmail: "hello@example.com",
      recruiterName: null,
      status: "sent",
      createdAt: date,
    },
    {
      id: "complained",
      company: "Valid Co",
      companyEmail: "HELLO@example.com",
      recruiterName: null,
      status: "complained",
      createdAt: new Date(date.getTime() + 1),
    },
  ]);

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].status, "SKIPPED");
  assert.match(candidates[0].skipReason ?? "", /invalid/i);
  assert.equal(candidates[1].status, "SKIPPED");
  assert.match(candidates[1].skipReason ?? "", /bounced or was complained/i);
});

test("suppresses contacts explicitly marked replied", () => {
  const [candidate] = selectOutreachCandidates(
    [
      {
        id: "application-1",
        company: "Example Co",
        companyEmail: "reply@example.com",
        recruiterName: null,
        status: "sent",
        createdAt: date,
      },
    ],
    new Set(["reply@example.com"]),
  );

  assert.equal(candidate.status, "SKIPPED");
  assert.match(candidate.skipReason ?? "", /marked as replied/i);
});

test("renders company and known recipient without trusting HTML or unsafe URLs", () => {
  const message = renderOutreachMessage({
    company: "<Example & Co>",
    recruiterName: "Sam <script>",
    senderName: "A User",
    portfolio: "javascript:alert(1)",
    resumeUrl: "https://example.com/resume",
  });

  assert.match(message.subject, /<Example & Co>/);
  assert.match(message.html, /Hi Sam &lt;script&gt;,/);
  assert.match(message.html, /&lt;Example &amp; Co&gt;/);
  assert.doesNotMatch(message.html, /javascript:/);
  assert.match(message.html, /href="https:\/\/example\.com\/resume"/);
  assert.match(message.text, /Resume: https:\/\/example\.com\/resume/);
});

test("normalizes the UTC day and creates a factual fallback summary", () => {
  assert.equal(DAILY_OUTREACH_LIMIT, 15);
  assert.equal(hasDailyOutreachQuota(14), true);
  assert.equal(hasDailyOutreachQuota(15), false);
  assert.equal(hasDailyOutreachQuota(-1), false);
  const localTime = new Date("2026-10-10T23:59:59.000Z");
  assert.equal(getUtcDate(localTime).toISOString(), "2026-10-10T00:00:00.000Z");
  assert.match(
    getDeterministicDailySummary({
      authorized: 3,
      accepted: 2,
      delivered: 1,
      failed: 1,
      skipped: 4,
    }),
    /3 send attempts authorized; 2 accepted by the email provider; 1 confirmed delivered/,
  );
});

test("renders a digest that distinguishes provider acceptance from delivery", async () => {
  const html = await renderDailyOutreachEmail({
    userName: "A User",
    reportDate: "2026-10-10",
    summary: "One message was accepted.",
    counts: { authorized: 1, accepted: 1, delivered: 0, failed: 0, skipped: 0 },
    attempts: [
      {
        company: "Example Co",
        companyEmail: "person@example.com",
        templateName: "Cold Outreach",
        status: "ACCEPTED",
        authorizedAt: date,
        providerMessageId: "resend-id",
        failureReason: null,
      },
    ],
    dashboardUrl: "https://applyfast.example/outreach",
  });

  assert.match(html, /Accepted by Resend/);
  assert.match(html, /delivery not yet confirmed/);
  assert.match(html, /person@example\.com/);
  assert.match(html, /resend-id/);
  assert.match(html, /https:\/\/applyfast\.example\/outreach/);
});
