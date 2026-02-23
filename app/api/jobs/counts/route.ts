import { NextResponse } from "next/server";
import { getJobCountsByRole } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counts = await getJobCountsByRole();
    return NextResponse.json(counts);
  } catch (error) {
    console.error("Counts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch counts" },
      { status: 500 }
    );
  }
}
