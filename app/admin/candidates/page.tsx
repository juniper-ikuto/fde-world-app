"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCandidate {
  id: number;
  email: string;
  name: string | null;
  surname: string | null;
  role_types: string | null;
  location: string | null;
  linkedin_url: string | null;
  cv_path: string | null;
  cv_filename: string | null;
  created_at: string | null;
  open_to_work: string | null;
  current_role: string | null;
  current_company: string | null;
  years_experience: number | null;
  skills: string | null;
  work_auth: string | null;
  notice_period: string | null;
  salary_min: number | null;
  salary_currency: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  se: "Solutions Engineer",
  fde: "Forward Deployed Engineer",
  presales: "Pre-Sales",
  tam: "TAM",
  impl: "Implementation",
};

function AdminCandidatesContent() {
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [search, setSearch] = useState("");
  const [hasCv, setHasCv] = useState(false);
  const [hasLinkedin, setHasLinkedin] = useState(false);
  const [openToWork, setOpenToWork] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limit = 50;

  const fetchCandidates = useCallback(
    async (
      searchTerm: string,
      cv: boolean,
      linkedin: boolean,
      otw: boolean,
      pg: number
    ) => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (cv) params.set("has_cv", "true");
        if (linkedin) params.set("has_linkedin", "true");
        if (otw) params.set("open_to_work", "true");
        params.set("page", String(pg));
        params.set("limit", String(limit));

        const res = await fetch(`/api/admin/candidates?${params}`);

        if (!res.ok) {
          setLoading(false);
          return;
        }

        setAuthorized(true);
        const data = await res.json();
        setCandidates(data.candidates || []);
        setTotal(data.total || 0);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCandidates(search, hasCv, hasLinkedin, openToWork, page);
  }, [fetchCandidates, hasCv, hasLinkedin, openToWork, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchCandidates(value, hasCv, hasLinkedin, openToWork, 1);
    }, 350);
  };

  const toggleFilter = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean
  ) => {
    setter(!current);
    setPage(1);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const parseRoleTypes = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-sm text-text-tertiary mb-3">Not authorised</p>
          <Link href="/admin/login" className="text-sm text-accent hover:underline">
            Go to admin login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-6">
        Candidate Management
      </h1>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search name, surname or email\u2026"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm bg-bg-elevated border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => toggleFilter(setHasCv, hasCv)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
            hasCv
              ? "bg-accent text-white border-accent"
              : "bg-bg-elevated border-border text-text-secondary hover:border-accent/40"
          )}
        >
          Has CV
        </button>
        <button
          onClick={() => toggleFilter(setHasLinkedin, hasLinkedin)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
            hasLinkedin
              ? "bg-accent text-white border-accent"
              : "bg-bg-elevated border-border text-text-secondary hover:border-accent/40"
          )}
        >
          Has LinkedIn
        </button>
        <button
          onClick={() => toggleFilter(setOpenToWork, openToWork)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
            openToWork
              ? "bg-accent text-white border-accent"
              : "bg-bg-elevated border-border text-text-secondary hover:border-accent/40"
          )}
        >
          Open to work
        </button>
      </div>

      {/* Result count */}
      <p className="text-xs text-text-tertiary mb-3">
        {total} candidate{total !== 1 ? "s" : ""}
      </p>

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <p className="text-sm text-text-tertiary py-12 text-center">
          No candidates found.
        </p>
      ) : (
        <div className="space-y-2">
          {candidates.map((c) => {
            const roles = parseRoleTypes(c.role_types);
            const isExpanded = expandedId === c.id;

            return (
              <div
                key={c.id}
                className="bg-bg-elevated border border-border rounded-md overflow-hidden"
              >
                {/* Main row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-bg-secondary/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {[c.name, c.surname].filter(Boolean).join(" ") || "No name"}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {c.email}
                      {c.location ? ` \u00b7 ${c.location}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {roles.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent/10 text-accent"
                        >
                          {ROLE_LABELS[r] || r}
                        </span>
                      ))}
                      {c.open_to_work === "active" && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-success/10 text-success">
                          Open to work
                        </span>
                      )}
                      {c.cv_path && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-600">
                          CV on file
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {c.linkedin_url && (
                      <a
                        href={c.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-text-tertiary hover:text-accent rounded transition-colors"
                        title="LinkedIn profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {c.cv_filename && (
                      <span
                        className="p-1.5 text-text-tertiary"
                        title={`CV: ${c.cv_filename}`}
                      >
                        <FileText className="w-4 h-4" />
                      </span>
                    )}
                    <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-tertiary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-tertiary" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <Detail label="Current role" value={c.current_role} />
                      <Detail label="Company" value={c.current_company} />
                      <Detail
                        label="Experience"
                        value={
                          c.years_experience != null
                            ? `${c.years_experience} years`
                            : null
                        }
                      />
                      <Detail label="Skills" value={c.skills} />
                      <Detail label="Work auth" value={c.work_auth} />
                      <Detail label="Notice period" value={c.notice_period} />
                      <Detail
                        label="Salary min"
                        value={
                          c.salary_min != null
                            ? `${c.salary_min.toLocaleString()} ${c.salary_currency || "GBP"}`
                            : null
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-elevated border border-border rounded-md hover:border-accent disabled:opacity-40 disabled:hover:border-border transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Previous
          </button>
          <span className="text-xs text-text-tertiary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-elevated border border-border rounded-md hover:border-accent disabled:opacity-40 disabled:hover:border-border transition-colors"
          >
            Next
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <span className="text-text-tertiary">{label}</span>
      <p className="text-text-primary mt-0.5 break-words">
        {value || "\u2014"}
      </p>
    </div>
  );
}

export default function AdminCandidatesPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        }
      >
        <AdminCandidatesContent />
      </Suspense>
    </div>
  );
}
