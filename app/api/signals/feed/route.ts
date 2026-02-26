import { NextResponse } from "next/server";
import { getSignalsFeed } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const signals = await getSignalsFeed(20);
    return NextResponse.json(signals);
  } catch (err) {
    console.error("signals/feed error:", err);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
