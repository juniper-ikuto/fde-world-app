"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import Nav from "@/components/Nav";
import JobCard, { JobCardSkeleton } from "@/components/JobCard";
import JobDrawer from "@/components/JobDrawer";
import type { Job } from "@/lib/db";
import Link from "next/link";

export default function SavedPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await fetch("/api/saved/jobs");
        if (!res.ok) {
          router.push("/signup");
          return;
        }
        const data = await res.json();
        const fetchedJobs: Job[] = data.jobs || [];
        setJobs(fetchedJobs);
        setSavedUrls(new Set(fetchedJobs.map((j) => j.url)));
      } catch {
        router.push("/signup");
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [router]);

  const handleUnsave = async (jobUrl: string) => {
    setSavedUrls((prev) => {
      const next = new Set(Array.from(prev));
      next.delete(jobUrl);
      return next;
    });
    setJobs((prev) => prev.filter((j) => j.url !== jobUrl));

    try {
      await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl }),
      });
    } catch {
      // Revert
      setSavedUrls((prev) => { const next = new Set(Array.from(prev)); next.add(jobUrl); return next; });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="max-w-container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-[800px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Bookmark className="w-5 h-5 text-text-tertiary" />
            <h1 className="text-xl font-semibold tracking-heading text-text-primary">
              Saved Jobs
            </h1>
            {!loading && (
              <span className="text-sm text-text-tertiary ml-1">
                ({jobs.length})
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.url}
                  job={job}
                  isSaved={savedUrls.has(job.url)}
                  onUnsave={handleUnsave}
                  onClick={setSelectedJob}
                  isAuthenticated={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <JobDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Bookmark className="w-10 h-10 text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        No saved jobs yet
      </h3>
      <p className="text-sm text-text-secondary max-w-[300px] mx-auto mb-4">
        When you find roles you&apos;re interested in, save them here to
        revisit later.
      </p>
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-accent border border-accent/20 rounded-md hover:bg-accent-light transition-colors duration-150"
      >
        Browse jobs
      </Link>
    </div>
  );
}
