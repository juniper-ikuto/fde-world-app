import { NextRequest, NextResponse } from "next/server";
import { updateJob, deleteJob } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminSession(request)) {
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
      "title", "company", "location", "salary_range",
      "job_url", "status", "posted_date",
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
  if (!getAdminSession(request)) {
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
