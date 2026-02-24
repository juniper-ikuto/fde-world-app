"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, SearchX } from "lucide-react";
import Nav from "@/components/Nav";
import JobCard, { JobCardSkeleton } from "@/components/JobCard";
import JobDrawer from "@/components/JobDrawer";
import FilterSidebar, { MobileFilterButton } from "@/components/FilterSidebar";
import type { Job } from "@/lib/db";

interface Filters {
  roleTypes: string[];
  countries: string[];
  remote: boolean;
  stages: string[];
  salaryOnly: boolean;
  sort: "posted" | "discovered";
  companies: string[];
  freshness: string[];
}

function FeedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = searchParams.get("role");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    roleTypes: initialRole ? [initialRole] : [],
    countries: [],
    remote: false,
    stages: [],
    salaryOnly: false,
    sort: "posted",
    companies: [],
    freshness: [],
  });

  // Check auth and load saved jobs — redirect if not signed in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/saved");
        if (!res.ok) {
          router.push("/signup");
          return;
        }
        const data = await res.json();
        setSavedUrls(new Set(data.savedUrls));
        setIsAuthenticated(true);
      } catch {
        router.push("/signup");
      }
    };
    checkAuth();
  }, [router]);

  // Fetch jobs
  const fetchJobs = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (filters.roleTypes.length > 0)
          params.set("roleTypes", filters.roleTypes.join(","));
        if (filters.countries.length > 0)
          params.set("country", filters.countries[0]);
        if (filters.remote) params.set("remote", "true");
        if (filters.stages.length > 0)
          params.set("stage", filters.stages.join(","));
        if (filters.salaryOnly) params.set("salaryOnly", "true");
        if (filters.companies.length > 0)
          params.set("excludeCompanies", filters.companies.join(","));
        if (filters.freshness.length > 0)
          params.set("freshness", filters.freshness.join(","));
        params.set("sort", filters.sort);
        params.set("page", pageNum.toString());
        params.set("limit", "20");

        const res = await fetch(`/api/jobs?${params}`);
        const data = await res.json();

        if (append) {
          setJobs((prev) => [...prev, ...data.jobs]);
        } else {
          setJobs(data.jobs);
        }
        setTotal(data.total);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Re-fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchJobs(1);
  }, [fetchJobs]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobs(nextPage, true);
  };

  const handleSave = async (jobUrl: string) => {
    if (!isAuthenticated) return;
    setSavedUrls((prev) => { const next = new Set(Array.from(prev)); next.add(jobUrl); return next; });
    try {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl }),
      });
    } catch {
      setSavedUrls((prev) => {
        const next = new Set(Array.from(prev));
        next.delete(jobUrl);
        return next;
      });
    }
  };

  const handleUnsave = async (jobUrl: string) => {
    if (!isAuthenticated) return;
    setSavedUrls((prev) => {
      const next = new Set(Array.from(prev));
      next.delete(jobUrl);
      return next;
    });
    try {
      await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl }),
      });
    } catch {
      setSavedUrls((prev) => { const next = new Set(Array.from(prev)); next.add(jobUrl); return next; });
    }
  };

  const activeFilterCount =
    filters.roleTypes.length +
    filters.countries.length +
    filters.stages.length +
    filters.companies.length +
    filters.freshness.length +
    (filters.remote ? 1 : 0) +
    (filters.salaryOnly ? 1 : 0);

  const hasMore = jobs.length < total;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="max-w-container mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              totalJobs={total}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MobileFilterButton
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  activeCount={activeFilterCount}
                />
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary tabular-nums">
                    {total.toLocaleString()}
                  </span>{" "}
                  open roles
                </p>
              </div>
            </div>

            {/* Mobile filters */}
            {mobileFiltersOpen && (
              <div className="lg:hidden mb-4 p-4 bg-bg-elevated border border-border rounded-md animate-fade-in">
                <FilterSidebar
                  filters={filters}
                  onChange={(f) => {
                    setFilters(f);
                    setMobileFiltersOpen(false);
                  }}
                  totalJobs={total}
                />
              </div>
            )}

            {/* Job list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.url}
                      job={job}
                      isSaved={savedUrls.has(job.url)}
                      onSave={handleSave}
                      onUnsave={handleUnsave}
                      onClick={setSelectedJob}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-md hover:border-border-hover hover:text-text-primary transition-all duration-150 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Load more
                    </button>
                    <p className="text-xs text-text-tertiary mt-2">
                      Showing {jobs.length} of {total.toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Job drawer */}
      <JobDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-primary">
          <Nav />
          <div className="max-w-container mx-auto px-4 sm:px-6 py-6">
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <SearchX className="w-10 h-10 text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        No jobs found
      </h3>
      <p className="text-sm text-text-secondary max-w-[300px] mx-auto">
        Try adjusting your filters or broadening your search to see more roles.
      </p>
    </div>
  );
}
