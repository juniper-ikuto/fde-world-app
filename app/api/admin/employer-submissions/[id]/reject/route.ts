import { NextRequest, NextResponse } from "next/server";
import {
  rejectSubmission,
  getEmployerSubmissionById,
  getEmployerById,
} from "@/lib/db";
import { sendRejectionEmail } from "@/lib/employer-email";
import { getAdminSession } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const submission = await getEmployerSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body is fine
    }

    await rejectSubmission(id, reason);

    // Send rejection email to employer
    const employer = await getEmployerById(submission.employer_id);
    if (employer) {
      const emailResult = await sendRejectionEmail(
        employer.email,
        submission.scraped_title || submission.job_url,
        reason
      );
      if (!emailResult.success) {
        console.error("Failed to send rejection email:", emailResult.error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reject submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
