import { NextRequest, NextResponse } from "next/server";
import { upsertSignals } from "@/lib/db";

export const dynamic = "force-dynamic";

const SYNC_TOKEN = process.env.DB_SYNC_TOKEN;

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!SYNC_TOKEN || token !== SYNC_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const signals = body.signals;

    if (!Array.isArray(signals)) {
      return NextResponse.json(
        { error: "signals must be an array" },
        { status: 400 }
      );
    }

    const result = await upsertSignals(signals);
    return NextResponse.json(result);
  } catch (err) {
    console.error("signals/ingest error:", err);
    return NextResponse.json(
      { error: "Failed to ingest signals" },
      { status: 500 }
    );
  }
}
