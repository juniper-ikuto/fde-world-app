import { NextRequest, NextResponse } from "next/server";
import { verifyCandidate } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

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

    const candidate = await verifyCandidate(token);

    if (!candidate) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSessionToken(candidate.id);
    setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        email: candidate.email,
        name: candidate.name,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
