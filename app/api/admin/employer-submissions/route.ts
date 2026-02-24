import { NextRequest, NextResponse } from "next/server";
import { getAllPendingSubmissions } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  const syncToken = process.env.DB_SYNC_TOKEN;

  if (!syncToken || token !== syncToken) {
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
