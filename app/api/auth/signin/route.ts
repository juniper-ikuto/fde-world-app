import { NextRequest, NextResponse } from "next/server";
import { getCandidateByEmail, setVerificationToken } from "@/lib/db";
import { generateToken, getTokenExpiry } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const candidate = await getCandidateByEmail(email.toLowerCase().trim());

    // Always return success — prevents email enumeration
    if (candidate) {
      const token = generateToken();
      const expiresAt = getTokenExpiry();
      await setVerificationToken(candidate.id, token, expiresAt);
      await sendMagicLink(email, candidate.name || "there", token);
    }

    return NextResponse.json({
      success: true,
      message: "If that address is registered, a sign-in link is on its way.",
    });
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
