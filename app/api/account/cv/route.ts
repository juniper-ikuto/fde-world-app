import { NextRequest, NextResponse } from "next/server";
import { getSessionCandidateId } from "@/lib/auth";
import { updateCandidate } from "@/lib/db";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const candidateId = await getSessionCandidateId();
    if (!candidateId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const cvFile = formData.get("cv") as File | null;

    if (!cvFile || cvFile.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (cvFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "CV file must be under 5MB" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(cvFile.type)) {
      return NextResponse.json(
        { error: "CV must be a PDF or Word document" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "cvs");
    fs.mkdirSync(uploadDir, { recursive: true });

    const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${randomUUID()}-${safeName}`;
    const filepath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await cvFile.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    const cvFilename = cvFile.name;
    const cvPath = `/uploads/cvs/${filename}`;

    await updateCandidate(candidateId, { cv_filename: cvFilename, cv_path: cvPath });

    return NextResponse.json({ cv_filename: cvFilename, cv_path: cvPath });
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload CV" },
      { status: 500 }
    );
  }
}
