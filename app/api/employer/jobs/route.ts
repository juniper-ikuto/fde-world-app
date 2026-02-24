import { NextRequest, NextResponse } from "next/server";
import { getSessionEmployerId } from "@/lib/employer-auth";
import {
  getEmployerById,
  getEmployerSubmissions,
  getOrCreateJobFromUrl,
  createEmployerSubmission,
} from "@/lib/db";
import { sendAdminNotification } from "@/lib/employer-email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const employerId = await getSessionEmployerId();
    if (!employerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "URL must be http or https" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch job details using the same logic as /api/jobs/detail
    let scraped_title: string | null = null;
    let scraped_company: string | null = null;
    let scraped_location: string | null = null;
    let scraped_description: string | null = null;

    try {
      const detailUrl = new URL("/api/jobs/detail", request.nextUrl.origin);
      detailUrl.searchParams.set("url", url);
      const detailRes = await fetch(detailUrl.toString(), {
        signal: AbortSignal.timeout(15000),
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        scraped_title = detail.title || null;
        scraped_description = detail.description_text?.slice(0, 1000) || null;
      }
    } catch (err) {
      console.error("Failed to scrape job details:", err);
    }

    // Get or create job from URL
    const { job_id, was_duplicate } = await getOrCreateJobFromUrl(
      url,
      scraped_title,
      scraped_company,
      scraped_location,
      scraped_description
    );

    // Create submission record
    const submission_id = await createEmployerSubmission(
      employerId,
      url,
      scraped_title,
      scraped_company,
      scraped_location,
      scraped_description,
      job_id
    );

    // Send notification to admin
    const employer = await getEmployerById(employerId);
    if (employer) {
      const emailResult = await sendAdminNotification(
        employer.company_name,
        scraped_title || url,
        url,
        submission_id
      );
      if (!emailResult.success) {
        console.error("Failed to send admin notification:", emailResult.error);
      }
    }

    return NextResponse.json({
      ok: true,
      submission_id,
      was_duplicate,
      scraped_title,
    });
  } catch (error) {
    console.error("Employer job submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const employerId = await getSessionEmployerId();
    if (!employerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const submissions = await getEmployerSubmissions(employerId);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Employer jobs list error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
