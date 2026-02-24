import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getEmployerBySessionToken,
  deleteEmployerSession,
  createEmployerSession,
  getCandidateByEmail,
  upsertCandidate,
} from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { setEmployerSessionCookie } from "@/lib/employer-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Look up employer by magic link token
    const employer = await getEmployerBySessionToken(token);
    if (!employer) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Delete used magic link token
    await deleteEmployerSession(token);

    // Create a long-lived session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    await createEmployerSession(employer.id, sessionToken, expiresAt);

    // Set cookie
    setEmployerSessionCookie(sessionToken);

    // Also give employer access to candidate side
    let candidateId: number | null = null;
    try {
      const existing = await getCandidateByEmail(employer.email);
      if (existing) {
        candidateId = existing.id;
      } else {
        // Create a candidate record for this employer so they can use the job feed
        const candidate = await upsertCandidate(employer.email, employer.name, []);
        candidateId = candidate.id;
      }
      if (candidateId) {
        const candidateToken = await createSessionToken(candidateId);
        setSessionCookie(candidateToken);
      }
    } catch (err) {
      // Non-fatal — employer still logs in fine even if candidate creation fails
      console.error("Failed to create candidate session for employer:", err);
    }

    return NextResponse.json({
      ok: true,
      employer: { id: employer.id, name: employer.name, company_name: employer.company_name },
    });
  } catch (error) {
    console.error("Employer auth error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
