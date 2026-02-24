import { NextRequest, NextResponse } from "next/server";
import { updateJob, deleteJob } from "@/lib/db";

export const dynamic = "force-dynamic";

function authorize(request: NextRequest): boolean {
  const token = request.headers.get("x-admin-token");
  const syncToken = process.env.DB_SYNC_TOKEN;
  return !!(syncToken && token === syncToken);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const allowed = [
      "title", "company", "location", "salary_min", "salary_max",
      "salary_currency", "job_url", "status", "posted_date",
    ] as const;

    const fields: Record<string, string | number | null> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields[key] = body[key];
      }
    }

    await updateJob(jobId, fields);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin job update error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const url = new URL(request.url);
    const hard = url.searchParams.get("hard") === "true";

    await deleteJob(jobId, hard);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin job delete error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
