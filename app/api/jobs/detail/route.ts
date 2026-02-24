import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Semantic tags to keep (no div/span — they become structureless noise when classes are stripped)
const ALLOWED_TAGS = new Set([
  "p", "ul", "ol", "li",
  "h1", "h2", "h3", "h4",
  "strong", "em", "b", "i",
  "a", "br",
]);

function sanitiseHtml(html: string): string {
  // 1. Strip script/style/iframe and their contents
  let clean = html.replace(
    /<(script|style|iframe|noscript|head)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );

  // 2. Remove event attributes
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 3. Convert block-level unknown tags to paragraph breaks so content doesn't run together
  clean = clean.replace(/<\/?(?:div|section|article|header|footer|aside|main|table|tr|td|th|thead|tbody)[^>]*>/gi, "\n");

  // 4. Process remaining tags
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag) => {
    const lower = tag.toLowerCase();
    if (ALLOWED_TAGS.has(lower)) {
      if (lower === "a") {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']*)["']/i);
        if (hrefMatch && !match.startsWith("</")) {
          const href = hrefMatch[1];
          // Only keep http/https links
          if (href.startsWith("http://") || href.startsWith("https://")) {
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
          }
          return ""; // strip non-http links (mailto, javascript, etc)
        }
        return match.startsWith("</") ? "</a>" : "";
      }
      const isClosing = match.startsWith("</");
      return isClosing ? `</${lower}>` : `<${lower}>`;
    }
    return ""; // strip everything else, keep content
  });

  // 5. Convert newline sequences (from block tag removal) into paragraph breaks
  clean = clean.replace(/\n{2,}/g, "</p><p>");
  clean = clean.replace(/\n/g, " ");

  // 6. Collapse runs of <br> into paragraph breaks
  clean = clean.replace(/(<br\s*\/?>\s*){2,}/gi, "</p><p>");

  // 7. Remove empty tags
  clean = clean.replace(/<(p|li|h[1-4]|strong|em)>\s*<\/\1>/gi, "");

  // 8. Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8203;/g, ""); // zero-width space

  // 9. Collapse excess whitespace
  clean = clean.replace(/\s{3,}/g, " ").trim();

  // 10. Wrap bare text (not inside a block tag) in <p>
  if (clean && !clean.trimStart().startsWith("<")) {
    clean = `<p>${clean}</p>`;
  }

  return clean;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract company slug and job ID from a Greenhouse URL
function parseGreenhouseUrl(
  url: string
): { slug: string; jobId: string } | null {
  try {
    const parsed = new URL(url);
    // Format: https://boards.greenhouse.io/{slug}/jobs/{id}
    // or: https://job-boards.greenhouse.io/ts/{slug}/jobs/{id}
    const match = parsed.pathname.match(
      /(?:\/ts)?\/([^/]+)\/jobs\/(\d+)/
    );
    if (match) return { slug: match[1], jobId: match[2] };
  } catch {}
  return null;
}

// Extract company slug and job ID from a Lever URL
function parseLeverUrl(url: string): { slug: string; jobId: string } | null {
  try {
    const parsed = new URL(url);
    // Format: https://jobs.lever.co/{slug}/{uuid}
    const match = parsed.pathname.match(/\/([^/]+)\/([a-f0-9-]+)/);
    if (match) return { slug: match[1], jobId: match[2] };
  } catch {}
  return null;
}

async function fetchGreenhouseJob(
  url: string
): Promise<{ title: string; description_html: string } | null> {
  const parsed = parseGreenhouseUrl(url);
  if (!parsed) return null;

  try {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${parsed.slug}/jobs/${parsed.jobId}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || "",
      description_html: data.content || "",
    };
  } catch {
    return null;
  }
}

// Extract company slug and job UUID from an Ashby URL
function parseAshbyUrl(url: string): { slug: string; jobId: string } | null {
  try {
    const parsed = new URL(url);
    // Format: https://jobs.ashbyhq.com/{slug}/{uuid}
    const match = parsed.pathname.match(/^\/([^/]+)\/([a-f0-9-]+)/i);
    if (match) return { slug: match[1], jobId: match[2] };
  } catch {}
  return null;
}

async function fetchAshbyJob(
  url: string
): Promise<{ title: string; description_html: string } | null> {
  const parsed = parseAshbyUrl(url);
  if (!parsed) return null;

  try {
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${parsed.slug}/job-postings/${parsed.jobId}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    // Ashby returns descriptionHtml or descriptionBody
    const html = data.descriptionHtml || data.descriptionBody || "";
    return { title: data.title || "", description_html: html };
  } catch {
    return null;
  }
}

async function fetchLeverJob(
  url: string
): Promise<{ title: string; description_html: string } | null> {
  const parsed = parseLeverUrl(url);
  if (!parsed) return null;

  try {
    const apiUrl = `https://api.lever.co/v0/postings/${parsed.slug}/${parsed.jobId}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();

    // Build description from Lever's structured data
    let html = "";
    if (data.descriptionPlain) {
      html += `<p>${data.descriptionPlain.replace(/\n/g, "<br>")}</p>`;
    }
    if (data.lists && Array.isArray(data.lists)) {
      for (const list of data.lists) {
        html += `<h3>${list.text || ""}</h3><ul>`;
        if (list.content) {
          html += list.content;
        }
        html += "</ul>";
      }
    }
    if (data.additional) {
      html += `<div>${data.additional}</div>`;
    }
    return {
      title: data.text || "",
      description_html: html,
    };
  } catch {
    return null;
  }
}

// CSS selectors mapped to sources for scraping fallback
const SOURCE_SELECTORS: Record<string, string> = {
  greenhouse: "#app_body .content, #content, .job__description",
  lever: ".content .section-wrapper, .posting-page .content",
  ashby: ".ashby-job-posting-brief, [data-testid='job-posting']",
  workable: ".job-description, .jobdesciption",
  smartrecruiters: ".job-description, .jobad-description",
  recruitee: ".offer-description, .job-description",
  teamtailor: ".description, .job-ad__description",
};

async function fetchAndParseHtml(
  url: string,
  source: string
): Promise<{ title: string; description_html: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FDEWorld/1.0; +https://fdeworld.com)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Try to extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : "";

    // Try source-specific selectors via regex-based extraction
    const selectors = SOURCE_SELECTORS[source] || "";
    const selectorList = selectors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const selector of selectorList) {
      // Convert CSS class selector to regex pattern
      const className = selector.replace(/^[.#]/, "");
      const isId = selector.startsWith("#");

      const attrPattern = isId
        ? `id\\s*=\\s*["']${className}["']`
        : `class\\s*=\\s*["'][^"']*\\b${className}\\b[^"']*["']`;

      const regex = new RegExp(
        `<([a-z]+)[^>]*${attrPattern}[^>]*>([\\s\\S]*?)<\\/\\1>`,
        "i"
      );
      const match = html.match(regex);
      if (match && match[2] && match[2].length > 100) {
        return { title, description_html: match[2] };
      }
    }

    // Default heuristic: find the largest text block in a div
    const divRegex =
      /<div[^>]*>([\s\S]*?)<\/div>/gi;
    let bestContent = "";
    let bestLength = 200; // minimum threshold

    let divMatch;
    while ((divMatch = divRegex.exec(html)) !== null) {
      const content = divMatch[1];
      const textLength = stripHtml(content).length;
      if (textLength > bestLength) {
        bestLength = textLength;
        bestContent = content;
      }
    }

    if (bestContent) {
      return { title, description_html: bestContent };
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const source = searchParams.get("source") || "";

    if (!url) {
      return NextResponse.json(
        { error: "url parameter is required" },
        { status: 400 }
      );
    }

    let result: { title: string; description_html: string } | null = null;

    // Prefer ATS public APIs where available
    if (source === "greenhouse" || url.includes("greenhouse.io")) {
      result = await fetchGreenhouseJob(url);
    } else if (source === "lever" || url.includes("lever.co")) {
      result = await fetchLeverJob(url);
    } else if (source === "ashby" || url.includes("ashbyhq.com")) {
      result = await fetchAshbyJob(url);
    }

    // Fallback: scrape the HTML page
    if (!result) {
      result = await fetchAndParseHtml(url, source);
    }

    if (!result || !result.description_html) {
      return NextResponse.json(
        {
          title: "",
          description_html: "",
          description_text: "",
        },
        {
          headers: {
            "Cache-Control": "public, max-age=1800, s-maxage=1800",
          },
        }
      );
    }

    const description_html = sanitiseHtml(result.description_html);
    const description_text = stripHtml(description_html);

    return NextResponse.json(
      {
        title: result.title,
        description_html,
        description_text,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error("Job detail fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}
