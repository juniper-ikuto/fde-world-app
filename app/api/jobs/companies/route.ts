import { NextResponse } from "next/server";
import { getCompanies } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await getCompanies();
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Companies API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
