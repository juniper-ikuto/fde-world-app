import { Resend } from "resend";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from "@react-email/components";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function EmployerMagicLinkEmail({ name, token }: { name: string; token: string }) {
  const magicLink = `${APP_URL}/employer/auth?token=${token}`;

  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#FAFAFA",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: "16px", fontWeight: 600, color: "#09090B", marginBottom: "4px" }}>
            FDE World
          </Text>
          <Text style={{ fontSize: "11px", color: "#A1A1AA", marginTop: "0", marginBottom: "32px" }}>
            Employer Portal
          </Text>

          <Section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E4E7",
              borderRadius: "8px",
              padding: "32px",
            }}
          >
            <Text style={{ fontSize: "20px", fontWeight: 600, color: "#09090B", marginBottom: "8px", letterSpacing: "-0.025em" }}>
              Your FDE World employer link
            </Text>
            <Text style={{ fontSize: "14px", color: "#71717A", lineHeight: "20px", marginBottom: "24px" }}>
              Hi {name}, click the button below to access your employer dashboard. This link expires in 1 hour.
            </Text>

            <Button
              href={magicLink}
              style={{
                backgroundColor: "#4F46E5",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
                padding: "12px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Go to dashboard →
            </Button>

            <Text style={{ fontSize: "12px", color: "#A1A1AA", marginTop: "24px", lineHeight: "18px" }}>
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>
          </Section>

          <Hr style={{ borderColor: "#E4E4E7", margin: "32px 0" }} />

          <Text style={{ fontSize: "11px", color: "#A1A1AA", textAlign: "center" as const, lineHeight: "16px" }}>
            FDE World · Powered by{" "}
            <Link href="https://ikuto.com" style={{ color: "#A1A1AA" }}>
              Ikuto Group
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function sendEmployerMagicLink(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: "FDE World <noreply@fdeworld.com>",
      to: email,
      subject: "Your FDE World employer link",
      react: EmployerMagicLinkEmail({ name, token }),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

function AdminNotificationEmail({
  companyName,
  jobTitle,
  jobUrl,
  submissionId,
}: {
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  submissionId: number;
}) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#FAFAFA",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: "16px", fontWeight: 600, color: "#09090B", marginBottom: "4px" }}>
            FDE World — Admin
          </Text>

          <Section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E4E7",
              borderRadius: "8px",
              padding: "32px",
            }}
          >
            <Text style={{ fontSize: "20px", fontWeight: 600, color: "#09090B", marginBottom: "8px", letterSpacing: "-0.025em" }}>
              New job submission from {companyName}
            </Text>
            <Text style={{ fontSize: "14px", color: "#71717A", lineHeight: "20px", marginBottom: "8px" }}>
              <strong>Title:</strong> {jobTitle}
            </Text>
            <Text style={{ fontSize: "14px", color: "#71717A", lineHeight: "20px", marginBottom: "24px" }}>
              <strong>URL:</strong>{" "}
              <Link href={jobUrl} style={{ color: "#4F46E5" }}>
                {jobUrl}
              </Link>
            </Text>
            <Text style={{ fontSize: "12px", color: "#A1A1AA", lineHeight: "18px" }}>
              Submission #{submissionId} — review at /admin/employers
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function sendAdminNotification(
  companyName: string,
  jobTitle: string,
  jobUrl: string,
  submissionId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: "FDE World <noreply@fdeworld.com>",
      to: "david@ikuto.co.uk",
      subject: `New job submission from ${companyName}`,
      react: AdminNotificationEmail({ companyName, jobTitle, jobUrl, submissionId }),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

function RejectionEmail({
  jobTitle,
  reason,
}: {
  jobTitle: string;
  reason?: string;
}) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#FAFAFA",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: "16px", fontWeight: 600, color: "#09090B", marginBottom: "4px" }}>
            FDE World
          </Text>
          <Text style={{ fontSize: "11px", color: "#A1A1AA", marginTop: "0", marginBottom: "32px" }}>
            Employer Portal
          </Text>

          <Section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E4E7",
              borderRadius: "8px",
              padding: "32px",
            }}
          >
            <Text style={{ fontSize: "20px", fontWeight: 600, color: "#09090B", marginBottom: "8px", letterSpacing: "-0.025em" }}>
              Your FDE World job submission
            </Text>
            <Text style={{ fontSize: "14px", color: "#71717A", lineHeight: "20px", marginBottom: "8px" }}>
              Thanks for submitting <strong>{jobTitle}</strong> to FDE World. Unfortunately we
              weren&apos;t able to list this role at this time.
            </Text>
            {reason && (
              <Text style={{ fontSize: "14px", color: "#71717A", lineHeight: "20px" }}>
                <strong>Reason:</strong> {reason}
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: "#E4E4E7", margin: "32px 0" }} />

          <Text style={{ fontSize: "11px", color: "#A1A1AA", textAlign: "center" as const, lineHeight: "16px" }}>
            FDE World · Powered by{" "}
            <Link href="https://ikuto.com" style={{ color: "#A1A1AA" }}>
              Ikuto Group
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function sendRejectionEmail(
  email: string,
  jobTitle: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: "FDE World <noreply@fdeworld.com>",
      to: email,
      subject: "Your FDE World job submission",
      react: RejectionEmail({ jobTitle, reason }),
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
