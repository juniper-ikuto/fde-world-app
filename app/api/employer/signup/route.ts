import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getEmployerByEmail,
  createEmployer,
  createEmployerSession,
} from "@/lib/db";
import { sendEmployerMagicLink } from "@/lib/employer-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company_name } = body;

    if (!name || !email || !company_name) {
      return NextResponse.json(
        { error: "Name, email, and company name are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Create or get existing employer
    let employer = await getEmployerByEmail(email);
    if (!employer) {
      const id = await createEmployer(name.trim(), email.toLowerCase().trim(), company_name.trim());
      employer = { id, name: name.trim(), email: email.toLowerCase().trim(), company_name: company_name.trim(), created_at: new Date().toISOString() };
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await createEmployerSession(employer.id, token, expiresAt);

    // Send email
    const result = await sendEmployerMagicLink(email, name, token);
    if (!result.success) {
      console.error("Failed to send employer email:", result.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Employer signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
