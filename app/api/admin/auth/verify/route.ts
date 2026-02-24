import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, setAdminSessionCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/admin/login?error=invalid`);
  }

  const valid = await verifyAdminToken(token);

  if (!valid) {
    return NextResponse.redirect(`${APP_URL}/admin/login?error=invalid`);
  }

  const response = NextResponse.redirect(`${APP_URL}/admin`);
  setAdminSessionCookie(response);
  return response;
}
