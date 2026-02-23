import { NextRequest, NextResponse } from "next/server";
import { getSessionCandidateId } from "@/lib/auth";
import { getSavedJobUrls, saveJob, unsaveJob } from "@/lib/db";

export async function GET() {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedUrls = await getSavedJobUrls(candidateId);
    return NextResponse.json({ savedUrls });
  } catch (error) {
    console.error("Get saved error:", error);
    return NextResponse.json(
      { error: "Failed to get saved jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobUrl } = await request.json();
    if (!jobUrl) {
      return NextResponse.json(
        { error: "jobUrl is required" },
        { status: 400 }
      );
    }

    await saveJob(candidateId, jobUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save job error:", error);
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobUrl } = await request.json();
    if (!jobUrl) {
      return NextResponse.json(
        { error: "jobUrl is required" },
        { status: 400 }
      );
    }

    await unsaveJob(candidateId, jobUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsave job error:", error);
    return NextResponse.json(
      { error: "Failed to unsave job" },
      { status: 500 }
    );
  }
}
