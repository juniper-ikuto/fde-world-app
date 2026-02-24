import { NextRequest, NextResponse } from "next/server";
import { getSessionCandidateId } from "@/lib/auth";
import { getCandidateById } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate || !candidate.cv_path) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { filename } = params;

    // Prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify this file belongs to the authenticated candidate
    if (!candidate.cv_path.endsWith(filename)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const filepath = path.join(
      process.env.DATA_DIR || process.cwd(),
      "uploads",
      "cvs",
      filename
    );

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") {
      contentType = "application/pdf";
    } else if (ext === ".docx") {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (ext === ".doc") {
      contentType = "application/msword";
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CV file download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
