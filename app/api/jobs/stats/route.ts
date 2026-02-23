import { NextResponse } from "next/server";
import { getJobStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getJobStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
