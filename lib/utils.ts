export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

export function isNew(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 72;
}

export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    // For ATS URLs like job-boards.greenhouse.io/company/...
    // Try to extract the company slug
    const hostname = parsed.hostname;

    // Greenhouse
    if (hostname.includes("greenhouse.io")) {
      const match = parsed.pathname.match(/\/([^/]+)/);
      if (match) return `${match[1]}.com`;
    }

    // Lever
    if (hostname.includes("lever.co")) {
      const match = parsed.pathname.match(/\/([^/]+)/);
      if (match) return `${match[1]}.com`;
    }

    // Ashby
    if (hostname.includes("ashbyhq.com")) {
      const match = parsed.pathname.match(/\/([^/]+)/);
      if (match) return `${match[1]}.com`;
    }

    return hostname;
  } catch {
    return null;
  }
}

export function formatSalary(salary: string | null): string | null {
  if (!salary) return null;
  return salary;
}

export function getSourceLabel(source: string | null): string {
  if (!source) return "";
  const labels: Record<string, string> = {
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    recruitee: "Recruitee",
    workable: "Workable",
    smartrecruiters: "SmartRecruiters",
    teamtailor: "Teamtailor",
  };
  return labels[source] || source;
}

export function getFundingBadgeColors(stage: string | null): {
  bg: string;
  text: string;
} | null {
  if (!stage) return null;
  const lower = stage.toLowerCase();

  if (lower.includes("seed") || lower.includes("pre-seed"))
    return { bg: "bg-seed-bg", text: "text-seed-text" };
  if (lower.includes("series a"))
    return { bg: "bg-series-a-bg", text: "text-series-a-text" };
  if (lower.includes("series b"))
    return { bg: "bg-series-b-bg", text: "text-series-b-text" };
  if (lower.includes("series c") || lower.includes("series d") || lower.includes("series e"))
    return { bg: "bg-series-c-bg", text: "text-series-c-text" };

  return null;
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`;
  }
  return num.toLocaleString();
}
