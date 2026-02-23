import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Size of Google's generic "no favicon" placeholder to detect and reject
const GENERIC_FAVICON_SIZES = [726]; // Google's grey globe fallback icon

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
      { signal: AbortSignal.timeout(4000) }
    );

    if (!res.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const buf = await res.arrayBuffer();

    // Reject Google's generic grey globe placeholder (known byte sizes)
    if (GENERIC_FAVICON_SIZES.includes(buf.byteLength)) {
      return new NextResponse(null, { status: 404 });
    }

    // Also reject very small images (likely generic)
    if (buf.byteLength < 200) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=604800", // cache 7 days
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
