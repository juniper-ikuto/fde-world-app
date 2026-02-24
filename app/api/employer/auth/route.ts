import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getEmployerBySessionToken,
  deleteEmployerSession,
  createEmployerSession,
} from "@/lib/db";
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
