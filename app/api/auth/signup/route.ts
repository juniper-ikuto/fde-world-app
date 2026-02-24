import { NextRequest, NextResponse } from "next/server";
import { upsertCandidate, setVerificationToken } from "@/lib/db";
import { generateToken, getTokenExpiry } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let email: string;
    let name: string;
    let surname: string = "";
    let roleTypes: string[] = [];
    let linkedinUrl: string | undefined;
    let cvFilename: string | undefined;
    let cvPath: string | undefined;
    let location: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      email = (formData.get("email") as string) || "";
      name = (formData.get("name") as string) || "";
      surname = (formData.get("surname") as string) || "";
      const roleTypesRaw = formData.get("roleTypes") as string;
      roleTypes = roleTypesRaw ? JSON.parse(roleTypesRaw) : [];
      linkedinUrl = (formData.get("linkedin_url") as string) || undefined;
      location = (formData.get("location") as string) || undefined;

      const cvFile = formData.get("cv") as File | null;
      if (cvFile && cvFile.size > 0) {
        // Validate file size (5MB)
        if (cvFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "CV file must be under 5MB" },
            { status: 400 }
          );
        }

        // Validate file type
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

        // Save file
        const uploadDir = path.join(process.env.DATA_DIR || process.cwd(), "uploads", "cvs");
        fs.mkdirSync(uploadDir, { recursive: true });

        const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filename = `${randomUUID()}-${safeName}`;
        const filepath = path.join(uploadDir, filename);

        const buffer = Buffer.from(await cvFile.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        cvFilename = cvFile.name;
        cvPath = `/api/account/cv/file/${filename}`;
      }
    } else {
      const body = await request.json();
      email = body.email || "";
      name = body.name || "";
      surname = body.surname || "";
      roleTypes = body.roleTypes || [];
      linkedinUrl = body.linkedin_url || undefined;
      location = body.location || undefined;
    }

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Require at least LinkedIn URL or CV
    if (!linkedinUrl && !cvPath) {
      return NextResponse.json(
        { error: "Please provide a LinkedIn URL or CV" },
        { status: 400 }
      );
    }

    // Upsert candidate
    const candidate = await upsertCandidate(
      email.toLowerCase().trim(),
      name.trim(),
      roleTypes,
      linkedinUrl,
      cvFilename,
      cvPath,
      location,
      surname.trim()
    );

    // Generate verification token
    const token = generateToken();
    const expiresAt = getTokenExpiry();
    await setVerificationToken(candidate.id, token, expiresAt);

    // Send magic link email
    const result = await sendMagicLink(email, name, token);

    if (!result.success) {
      console.error("Failed to send email:", result.error);
      // Still return success — in dev mode the email won't send
      // but we want the flow to continue
    }

    return NextResponse.json({
      success: true,
      message: "Check your email for the sign-in link",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
