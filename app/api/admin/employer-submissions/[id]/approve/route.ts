import { NextRequest, NextResponse } from "next/server";
import {
  approveSubmission,
  getEmployerSubmissionById,
  getOrCreateJobFromUrl,
  updateSubmissionJobId,
} from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.headers.get("x-admin-token");
  const syncToken = process.env.DB_SYNC_TOKEN;

  if (!syncToken || token !== syncToken) {
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

    // If no job_id, create the job first
    if (!submission.job_id) {
      const { job_id } = await getOrCreateJobFromUrl(
        submission.job_url,
        submission.scraped_title,
        submission.scraped_company,
        submission.scraped_location,
        submission.scraped_description
      );
      await updateSubmissionJobId(id, job_id);
    }

    await approveSubmission(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Approve submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
