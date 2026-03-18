import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { resetDb, DB_PATH } from "@/lib/db";

export const dynamic = "force-dynamic";

const SYNC_TOKEN = process.env.DB_SYNC_TOKEN;

// Tables managed by the scraper — safe to overwrite
const SCRAPER_TABLES = [
  "jobs",
  "company_enrichment",
  "discovered_companies",
  "keywords",
  "ats_platforms",
];

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-sync-token");
  if (!SYNC_TOKEN || token !== SYNC_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const buf = await request.arrayBuffer();
    if (buf.byteLength < 4096) {
      return NextResponse.json({ error: "DB too small — rejected" }, { status: 400 });
    }

    // Write incoming DB to a temp file (better-sqlite3 needs a file path)
    const tmpPath = path.join(path.dirname(DB_PATH), "_sync_incoming.db");
    fs.writeFileSync(tmpPath, Buffer.from(buf));

    const incomingDb = new Database(tmpPath, { readonly: true });

    // Ensure target directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Close the main app DB so we can write to it
    resetDb();

    const railwayDb = new Database(DB_PATH);
    railwayDb.pragma("journal_mode = WAL");

    // Copy scraper tables from incoming → railway DB
    for (const table of SCRAPER_TABLES) {
      try {
        // Get CREATE TABLE statement from incoming DB
        const schema = incomingDb.prepare(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`
        ).get(table) as { sql: string } | undefined;
        if (!schema) continue;

        // Drop and recreate the table in railway DB
        railwayDb.exec(`DROP TABLE IF EXISTS ${table}`);
        railwayDb.exec(schema.sql);

        // Copy all rows
        const rows = incomingDb.prepare(`SELECT * FROM ${table}`).all();
        if (rows.length === 0) continue;

        const cols = Object.keys(rows[0] as Record<string, unknown>);
        const colNames = cols.join(", ");
        const placeholders = cols.map(() => "?").join(", ");
        const insertStmt = railwayDb.prepare(
          `INSERT OR REPLACE INTO ${table} (${colNames}) VALUES (${placeholders})`
        );

        const insertAll = railwayDb.transaction((items: Record<string, unknown>[]) => {
          for (const row of items) {
            insertStmt.run(...cols.map((c) => row[c] ?? null));
          }
        });
        insertAll(rows as Record<string, unknown>[]);
      } catch (e) {
        console.error(`Error syncing table ${table}:`, e);
      }
    }

    incomingDb.close();
    railwayDb.close();

    // Clean up temp file
    try { fs.unlinkSync(tmpPath); } catch { /* */ }

    // resetDb already called above; next request will re-open

    return NextResponse.json({ ok: true, bytes: buf.byteLength, path: DB_PATH });
  } catch (err) {
    console.error("sync-db error:", err);
    return NextResponse.json({ error: "Failed to sync DB" }, { status: 500 });
  }
}
