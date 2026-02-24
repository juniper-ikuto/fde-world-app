import { NextResponse } from "next/server";
import { getSessionEmployerId } from "@/lib/employer-auth";
import { getEmployerById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const employerId = await getSessionEmployerId();
    if (!employerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const employer = await getEmployerById(employerId);
    if (!employer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: employer.id,
      name: employer.name,
      email: employer.email,
      company_name: employer.company_name,
    });
  } catch (error) {
    console.error("Employer me error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
