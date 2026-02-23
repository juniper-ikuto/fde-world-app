import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { resetDb, DB_PATH } from "@/lib/db";

export const dynamic = "force-dynamic";

const SYNC_TOKEN = process.env.DB_SYNC_TOKEN;

export async function POST(request: NextRequest) {
  // Auth check
  const token = request.headers.get("x-sync-token");
  if (!SYNC_TOKEN || token !== SYNC_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const buf = await request.arrayBuffer();
    if (buf.byteLength < 4096) {
      return NextResponse.json({ error: "DB file too small — rejected" }, { status: 400 });
    }

    // Ensure the directory exists (Railway persistent volume)
    const dir = require("path").dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DB_PATH, Buffer.from(buf));
    resetDb(); // force in-memory reload on next request

    return NextResponse.json({
      ok: true,
      bytes: buf.byteLength,
      path: DB_PATH,
    });
  } catch (err) {
    console.error("sync-db error:", err);
    return NextResponse.json({ error: "Failed to write DB" }, { status: 500 });
  }
}
