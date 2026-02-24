import { NextRequest, NextResponse } from "next/server";
import { adminSearchCandidates } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const has_cv = url.searchParams.get("has_cv") === "true" ? true : undefined;
    const has_linkedin = url.searchParams.get("has_linkedin") === "true" ? true : undefined;
    const open_to_work = url.searchParams.get("open_to_work") === "true" ? true : undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "50", 10)));

    const result = await adminSearchCandidates({ search, has_cv, has_linkedin, open_to_work, page, limit });
    return NextResponse.json({
      candidates: result.candidates,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin candidates list error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
