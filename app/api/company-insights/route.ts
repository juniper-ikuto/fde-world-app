import { NextRequest, NextResponse } from "next/server";
import { getCompanyInsights } from "@/lib/db";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const slug = request.nextUrl.searchParams.get("slug"); // LinkedIn company URL slug

  if (!name && !slug) {
    return NextResponse.json(
      { error: "Missing required query parameter: name or slug" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const insight = await getCompanyInsights(name || "", slug || undefined);

    if (insight) {
      return NextResponse.json(insight, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ found: false }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Company insights API error:", error);
    return NextResponse.json({ found: false }, { headers: CORS_HEADERS });
  }
}
