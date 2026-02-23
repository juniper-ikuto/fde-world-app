import { NextRequest, NextResponse } from "next/server";
import { getSessionCandidateId, clearSessionCookie } from "@/lib/auth";
import {
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  getSavedJobCount,
} from "@/lib/db";

export async function GET() {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const savedCount = await getSavedJobCount(candidateId);

    return NextResponse.json({
      id: candidate.id,
      email: candidate.email,
      name: candidate.name,
      role_types: candidate.role_types,
      remote_pref: candidate.remote_pref,
      alert_freq: candidate.alert_freq,
      created_at: candidate.created_at,
      savedCount,
    });
  } catch (error) {
    console.error("Get account error:", error);
    return NextResponse.json(
      { error: "Failed to get account" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, role_types, remote_pref, alert_freq } = body;

    await updateCandidate(candidateId, {
      name,
      role_types: role_types !== undefined ? JSON.stringify(role_types) : undefined,
      remote_pref,
      alert_freq,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteCandidate(candidateId);
    clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
