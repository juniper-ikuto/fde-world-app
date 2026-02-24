"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Submission {
  id: number;
  employer_id: number;
  job_url: string;
  job_id: number | null;
  status: string;
  scraped_title: string | null;
  scraped_company: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  employer_name: string;
  employer_company: string;
}

function AdminContent() {
  const searchParams = useSearchParams();
  void searchParams; // Suspense boundary requires useSearchParams

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/employer-submissions");

      if (!res.ok) {
        setLoading(false);
        return;
      }

      setAuthorized(true);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {
      // unauthorized or error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/employer-submissions/${id}/approve`, {
        method: "POST",
      });
      await fetchSubmissions();
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/employer-submissions/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReasons[id] || undefined }),
      });
      await fetchSubmissions();
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const pending = submissions.filter((s) => s.status === "pending");
  const reviewed = submissions.filter((s) => s.status !== "pending");

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-8">
        Employer Submissions
      </h1>

      {/* Pending */}
      <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600" />
        Pending ({pending.length})
      </h2>

      {pending.length === 0 ? (
        <p className="text-sm text-text-tertiary mb-8">No pending submissions.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {pending.map((sub) => (
            <div
              key={sub.id}
              className="bg-bg-elevated border border-amber-200 rounded-md p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {sub.scraped_title || "Untitled"}
                  </h3>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {sub.employer_name} · {sub.employer_company}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <a
                      href={sub.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
                    >
                      View job
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-xs text-text-tertiary">
                      {formatDate(sub.submitted_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(sub.id)}
                    disabled={actionLoading === sub.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-success hover:bg-success/90 disabled:opacity-60 rounded-md transition-colors"
                  >
                    {actionLoading === sub.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(sub.id)}
                    disabled={actionLoading === sub.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-destructive hover:bg-destructive/90 disabled:opacity-60 rounded-md transition-colors"
                  >
                    {actionLoading === sub.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    Reject
                  </button>
                </div>
              </div>

              {/* Rejection reason input */}
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Rejection reason (optional)"
                  value={rejectReasons[sub.id] || ""}
                  onChange={(e) =>
                    setRejectReasons((prev) => ({
                      ...prev,
                      [sub.id]: e.target.value,
                    }))
                  }
                  className="w-full h-8 px-2 text-xs bg-bg-secondary border border-border rounded text-text-primary placeholder:text-text-tertiary focus:border-accent transition-all duration-150"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviewed */}
      <h2 className="text-sm font-semibold text-text-primary mb-3">
        Recently reviewed ({reviewed.length})
      </h2>

      {reviewed.length === 0 ? (
        <p className="text-sm text-text-tertiary">No reviewed submissions yet.</p>
      ) : (
        <div className="space-y-2">
          {reviewed.map((sub) => (
            <div
              key={sub.id}
              className={cn(
                "bg-bg-elevated border rounded-md p-4",
                sub.status === "approved" ? "border-success/30" : "border-destructive/30"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {sub.scraped_title || "Untitled"}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {sub.employer_name} · {sub.employer_company}
                    {sub.reviewed_at && ` · Reviewed ${formatDate(sub.reviewed_at)}`}
                  </p>
                  {sub.rejection_reason && (
                    <p className="text-xs text-text-tertiary mt-1">
                      Reason: {sub.rejection_reason}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full shrink-0",
                    sub.status === "approved"
                      ? "text-success bg-success/10"
                      : "text-destructive bg-destructive/10"
                  )}
                >
                  {sub.status === "approved" ? "Approved" : "Rejected"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEmployersPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        }
      >
        <AdminContent />
      </Suspense>
    </div>
  );
}
