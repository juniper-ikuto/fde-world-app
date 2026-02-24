"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Nav from "@/components/Nav";
import { cn } from "@/lib/utils";

interface Employer {
  id: number;
  name: string;
  email: string;
  company_name: string;
}

interface Submission {
  id: number;
  job_url: string;
  scraped_title: string | null;
  scraped_company: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  verified: number;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Submit form state
  const [jobUrl, setJobUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    ok: boolean;
    scraped_title?: string;
    was_duplicate?: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/employer/me");
        if (!meRes.ok) {
          router.push("/employers");
          return;
        }
        const meData = await meRes.json();
        setEmployer(meData);

        const jobsRes = await fetch("/api/employer/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setSubmissions(jobsData.submissions || []);
        }
      } catch {
        router.push("/employers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitResult({ ok: false, error: data.error });
        return;
      }

      setSubmitResult({
        ok: true,
        scraped_title: data.scraped_title,
        was_duplicate: data.was_duplicate,
      });

      // Refresh submissions list
      const jobsRes = await fetch("/api/employer/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setSubmissions(jobsData.submissions || []);
      }

      setJobUrl("");
    } catch {
      setSubmitResult({ ok: false, error: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="max-w-content mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/feed"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          ← Browse jobs
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h1 className="text-xl font-semibold tracking-heading text-text-primary">
              Your job submissions
            </h1>
            {employer && (
              <p className="text-sm text-text-secondary mt-0.5">
                {employer.company_name}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSubmitResult(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            Submit a new role
            {showForm ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="bg-bg-elevated border border-border rounded-lg p-5 mb-8 animate-fade-in">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="url"
                required
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="Paste your job listing URL (e.g. https://boards.greenhouse.io/...)"
                className="flex-1 h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 h-10 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors duration-150 shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </button>
            </form>

            {submitResult && (
              <div className="mt-3">
                {submitResult.ok ? (
                  <div className="flex items-start gap-2 text-sm text-success">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Submitted{submitResult.scraped_title ? `: ${submitResult.scraped_title}` : ""}.
                      {submitResult.was_duplicate
                        ? " This job was already in our database — we'll verify it."
                        : " We'll review and list it shortly."}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">{submitResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submissions list */}
        {submissions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-text-tertiary">
              No submissions yet. Submit your first role above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-bg-elevated border border-border rounded-md p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {sub.scraped_title || sub.job_url}
                    </h3>
                    {sub.scraped_company && (
                      <p className="text-sm text-text-secondary mt-0.5">
                        {sub.scraped_company}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Status badge */}
                      {sub.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending review
                        </span>
                      )}
                      {sub.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-success bg-success/10 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Live
                        </span>
                      )}
                      {sub.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-destructive bg-destructive/10 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Not approved
                        </span>
                      )}

                      <span className="text-xs text-text-tertiary">
                        Submitted {formatDate(sub.submitted_at)}
                      </span>

                      {sub.status === "approved" && (
                        <a
                          href="/feed"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                        >
                          View on FDE World
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {sub.status === "rejected" && sub.rejection_reason && (
                      <p className="text-xs text-text-secondary mt-2">
                        <span className="font-medium">Reason:</span> {sub.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
