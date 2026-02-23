import { NextRequest, NextResponse } from "next/server";
import { getJobs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const roleTypes = searchParams.get("roleTypes")
      ? searchParams.get("roleTypes")!.split(",")
      : [];
    const country = searchParams.get("country") || undefined;
    const remote = searchParams.get("remote") === "true";
    const stage = searchParams.get("stage")
      ? searchParams.get("stage")!.split(",")
      : [];
    const salaryOnly = searchParams.get("salaryOnly") === "true";
    const sort = (searchParams.get("sort") as "posted" | "discovered") || "posted";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const excludeCompaniesRaw = searchParams.get("excludeCompanies")
      ? searchParams.get("excludeCompanies")!.split(",")
      : [];

    // __none__ sentinel = user clicked "Remove all", return empty results
    if (excludeCompaniesRaw.includes("__none__")) {
      return NextResponse.json({ jobs: [], total: 0, page: 1, totalPages: 0 });
    }

    // __include__ prefix = inclusion mode (show only these companies)
    const isIncludeMode = excludeCompaniesRaw.includes("__include__");
    const excludeCompanies = isIncludeMode ? [] : excludeCompaniesRaw;
    const includeCompanies = isIncludeMode
      ? excludeCompaniesRaw.filter((c) => c !== "__include__")
      : [];

    const result = await getJobs({
      roleTypes,
      country,
      remote,
      stage,
      salaryOnly,
      sort,
      page,
      limit: Math.min(limit, 50),
      search,
      excludeCompanies,
      includeCompanies,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
