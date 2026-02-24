import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { isAllowedAdmin, createAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || "").toLowerCase().trim();

    // Always return ok to prevent email enumeration
    if (!email || !isAllowedAdmin(email)) {
      return NextResponse.json({ ok: true });
    }

    const token = await createAdminToken(email);
    const magicLink = `${APP_URL}/admin/auth/verify?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "FDE World Admin <noreply@fdeworld.com>",
      to: email,
      subject: "Admin login link",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA;">
          <p style="font-size: 16px; font-weight: 600; color: #09090B; margin-bottom: 4px;">FDE World</p>
          <p style="font-size: 11px; color: #A1A1AA; margin-top: 0; margin-bottom: 32px;">Admin Portal</p>
          <div style="background-color: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 8px; padding: 32px;">
            <p style="font-size: 20px; font-weight: 600; color: #09090B; margin-bottom: 8px; letter-spacing: -0.025em;">Your admin login link</p>
            <p style="font-size: 14px; color: #71717A; line-height: 20px; margin-bottom: 24px;">Click the button below to access the admin dashboard. This link expires in 1 hour.</p>
            <a href="${magicLink}" style="background-color: #4F46E5; color: #FFFFFF; font-size: 14px; font-weight: 500; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Go to admin dashboard</a>
            <p style="font-size: 12px; color: #A1A1AA; margin-top: 24px; line-height: 18px;">If you didn't request this email, you can safely ignore it.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send admin magic link:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin auth request error:", err);
    return NextResponse.json({ ok: true });
  }
}
