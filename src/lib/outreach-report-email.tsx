import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { CSSProperties } from "react";

type DailyOutreachEmailProps = {
  userName: string;
  reportDate: string;
  summary: string;
  counts: {
    authorized: number;
    accepted: number;
    delivered: number;
    failed: number;
    skipped: number;
  };
  attempts: Array<{
    company: string;
    companyEmail: string;
    templateName: string;
    status: string;
    authorizedAt: Date;
    providerMessageId: string | null;
    failureReason: string | null;
  }>;
  dashboardUrl: string | null;
};

function statusLabel(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "Accepted by Resend — delivery not yet confirmed";
    case "DELIVERED":
      return "Delivered";
    case "FAILED":
      return "Failed";
    case "UNKNOWN":
      return "Unknown — verify in Resend before retrying";
    default:
      return status;
  }
}

function DailyOutreachEmail({
  userName,
  reportDate,
  summary,
  counts,
  attempts,
  dashboardUrl,
}: DailyOutreachEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brand}>ApplyFast</Text>
            <Text style={styles.date}>{reportDate} · UTC</Text>
            <Heading as="h1" style={styles.heading}>
              Daily outreach report
            </Heading>
            <Text style={styles.text}>Hi {userName}, here is the latest batch activity.</Text>
          </Section>

          <Section style={styles.metrics}>
            <Text style={styles.metric}>Authorized send attempts: {counts.authorized}</Text>
            <Text style={styles.metric}>Accepted by Resend: {counts.accepted}</Text>
            <Text style={styles.metric}>Confirmed delivered: {counts.delivered}</Text>
            <Text style={styles.metric}>Failed or uncertain: {counts.failed}</Text>
            <Text style={styles.metric}>Skipped recipients: {counts.skipped}</Text>
          </Section>

          <Hr style={styles.rule} />
          <Heading as="h2" style={styles.subheading}>Summary</Heading>
          <Text style={styles.text}>{summary}</Text>
          <Text style={styles.note}>
            “Accepted by Resend” confirms provider acceptance only; it is not a delivery receipt.
          </Text>

          <Hr style={styles.rule} />
          <Heading as="h2" style={styles.subheading}>Recipient attempts</Heading>
          {attempts.length === 0 ? (
            <Text style={styles.text}>No outreach send attempts were authorized for this UTC date.</Text>
          ) : (
            attempts.map((attempt, index) => (
              <Section key={`${attempt.companyEmail}-${index}`} style={styles.recipient}>
                <Text style={styles.recipientTitle}>{attempt.company}</Text>
                <Text style={styles.detail}>Recipient: {attempt.companyEmail}</Text>
                <Text style={styles.detail}>Template: {attempt.templateName}</Text>
                <Text style={styles.detail}>Status: {statusLabel(attempt.status)}</Text>
                <Text style={styles.detail}>
                  Attempted: {attempt.authorizedAt.toISOString().replace("T", " ").slice(0, 19)} UTC
                </Text>
                {attempt.providerMessageId ? (
                  <Text style={styles.detail}>Resend message ID: {attempt.providerMessageId}</Text>
                ) : null}
                {attempt.failureReason ? (
                  <Text style={styles.failure}>Reason: {attempt.failureReason}</Text>
                ) : null}
              </Section>
            ))
          )}

          {dashboardUrl ? (
            <>
              <Hr style={styles.rule} />
              <Text style={styles.text}>
                <Link href={dashboardUrl} style={styles.link}>Open your outreach dashboard</Link>
              </Text>
            </>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

export async function renderDailyOutreachEmail(
  props: DailyOutreachEmailProps,
): Promise<string> {
  return render(<DailyOutreachEmail {...props} />);
}

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: "#f4f5f7",
    color: "#20242b",
    fontFamily: "Arial, Helvetica, sans-serif",
    margin: "0",
    padding: "24px 12px",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    margin: "0 auto",
    maxWidth: "640px",
    padding: "28px",
  },
  header: { paddingBottom: "12px" },
  brand: { fontSize: "14px", fontWeight: "700", margin: "0 0 8px" },
  date: { color: "#6b7280", fontSize: "12px", margin: "0 0 10px" },
  heading: { fontSize: "24px", lineHeight: "1.25", margin: "0 0 12px" },
  subheading: { fontSize: "16px", lineHeight: "1.4", margin: "18px 0 8px" },
  text: { fontSize: "14px", lineHeight: "1.6", margin: "8px 0" },
  metrics: { backgroundColor: "#f8fafc", padding: "12px 16px" },
  metric: { fontSize: "13px", lineHeight: "1.55", margin: "4px 0" },
  note: { color: "#6b7280", fontSize: "12px", lineHeight: "1.5", margin: "8px 0" },
  rule: { borderColor: "#e5e7eb", margin: "20px 0" },
  recipient: { borderBottom: "1px solid #e5e7eb", padding: "10px 0" },
  recipientTitle: { fontSize: "14px", fontWeight: "700", margin: "0 0 6px" },
  detail: { color: "#374151", fontSize: "12px", lineHeight: "1.5", margin: "3px 0" },
  failure: { color: "#b42318", fontSize: "12px", lineHeight: "1.5", margin: "4px 0" },
  link: { color: "#2563eb", textDecoration: "underline" },
};
