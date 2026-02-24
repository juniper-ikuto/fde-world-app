import { NextRequest, NextResponse } from "next/server";
import { getAllPendingSubmissions } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const submissions = await getAllPendingSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Admin submissions list error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
