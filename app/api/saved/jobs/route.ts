import { NextResponse } from "next/server";
import { getSessionCandidateId } from "@/lib/auth";
import { getSavedJobs } from "@/lib/db";

export async function GET() {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await getSavedJobs(candidateId);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get saved jobs error:", error);
    return NextResponse.json({ error: "Failed to get saved jobs" }, { status: 500 });
  }
}
