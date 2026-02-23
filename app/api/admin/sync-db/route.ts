import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
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

    const SQL = await initSqlJs({
      locateFile: (file: string) => path.join(process.cwd(), "public", file),
    });

    // Load incoming (scraper) DB
    const incomingDb = new SQL.Database(new Uint8Array(buf));

    // Load or create existing Railway DB (preserves candidates)
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const existingBuf = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
    const railwayDb = existingBuf
      ? new SQL.Database(existingBuf)
      : new SQL.Database();

    // Copy scraper tables from incoming → railway DB
    for (const table of SCRAPER_TABLES) {
      try {
        // Get CREATE TABLE statement from incoming DB
        const schema = incomingDb.exec(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`
        );
        if (!schema.length || !schema[0].values.length) continue;
        const createSql = schema[0].values[0][0] as string;

        // Drop and recreate the table in railway DB
        railwayDb.run(`DROP TABLE IF EXISTS ${table}`);
        railwayDb.run(createSql);

        // Copy all rows
        const rows = incomingDb.exec(`SELECT * FROM ${table}`);
        if (!rows.length) continue;

        const cols = rows[0].columns.join(", ");
        const placeholders = rows[0].columns.map(() => "?").join(", ");
        const stmt = railwayDb.prepare(
          `INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`
        );
        for (const row of rows[0].values) {
          stmt.run(row as (string | number | null)[]);
        }
        stmt.free();
      } catch (e) {
        console.error(`Error syncing table ${table}:`, e);
      }
    }

    // Write updated Railway DB back to disk
    const updatedBuf = railwayDb.export();
    fs.writeFileSync(DB_PATH, updatedBuf);

    incomingDb.close();
    railwayDb.close();
    resetDb(); // reload in-memory DB on next request

    return NextResponse.json({ ok: true, bytes: buf.byteLength, path: DB_PATH });
  } catch (err) {
    console.error("sync-db error:", err);
    return NextResponse.json({ error: "Failed to sync DB" }, { status: 500 });
  }
}
