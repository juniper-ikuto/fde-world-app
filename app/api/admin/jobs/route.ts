import { NextRequest, NextResponse } from "next/server";
import { adminSearchJobs } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const source = url.searchParams.get("source") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "50", 10)));

    const result = await adminSearchJobs({ search, status, source, page, limit });
    return NextResponse.json({
      jobs: result.jobs,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin jobs list error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
