"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminJob {
  id: number;
  title: string;
  company: string;
  location: string | null;
  job_url: string | null;
  source: string | null;
  status: string;
  posted_date: string | null;
  first_seen_at: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
}

const ATS_PLATFORMS = ["greenhouse", "lever", "ashby", "recruitee", "workable"] as const;

function AdminJobsContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [editJob, setEditJob] = useState<AdminJob | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limit = 50;

  const fetchJobs = useCallback(
    async (searchTerm: string, status: string, source: string, pg: number) => {
      if (!tokenParam) {
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (status !== "all") params.set("status", status);
        if (source !== "all") params.set("source", source);
        params.set("page", String(pg));
        params.set("limit", String(limit));

        const res = await fetch(`/api/admin/jobs?${params}`, {
          headers: { "x-admin-token": tokenParam },
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        setAuthorized(true);
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    },
    [tokenParam]
  );

  useEffect(() => {
    fetchJobs(search, statusFilter, sourceFilter, page);
  }, [fetchJobs, statusFilter, sourceFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchJobs(value, statusFilter, sourceFilter, 1);
    }, 350);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSourceChange = (value: string) => {
    setSourceFilter(value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (!tokenParam) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": tokenParam },
      });
      setDeleteConfirm(null);
      await fetchJobs(search, statusFilter, sourceFilter, page);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (job: AdminJob) => {
    setEditJob(job);
    setEditForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary_min: job.salary_min != null ? String(job.salary_min) : "",
      salary_max: job.salary_max != null ? String(job.salary_max) : "",
      salary_currency: job.salary_currency || "",
      job_url: job.job_url || "",
      status: job.status || "open",
      posted_date: job.posted_date || "",
    });
  };

  const handleSave = async () => {
    if (!tokenParam || !editJob) return;
    setSaving(true);
    try {
      const body: Record<string, string | number | null> = {};
      body.title = editForm.title;
      body.company = editForm.company;
      body.location = editForm.location || null;
      body.salary_min = editForm.salary_min ? parseInt(editForm.salary_min, 10) : null;
      body.salary_max = editForm.salary_max ? parseInt(editForm.salary_max, 10) : null;
      body.salary_currency = editForm.salary_currency || null;
      body.job_url = editForm.job_url;
      body.status = editForm.status;
      body.posted_date = editForm.posted_date || null;

      await fetch(`/api/admin/jobs/${editJob.id}`, {
        method: "PATCH",
        headers: {
          "x-admin-token": tokenParam,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      setEditJob(null);
      await fetchJobs(search, statusFilter, sourceFilter, page);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!tokenParam || !authorized) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-text-tertiary">Unauthorized</p>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-6">
        Job Management
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search title or company…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm bg-bg-elevated border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 px-3 text-sm bg-bg-elevated border border-border rounded-md text-text-primary focus:border-accent focus:outline-none transition-colors"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => handleSourceChange(e.target.value)}
          className="h-9 px-3 text-sm bg-bg-elevated border border-border rounded-md text-text-primary focus:border-accent focus:outline-none transition-colors"
        >
          <option value="all">All sources</option>
          {ATS_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className="text-xs text-text-tertiary mb-3">
        Showing {jobs.length} of {total} jobs
      </p>

      {/* Job list */}
      {jobs.length === 0 ? (
        <p className="text-sm text-text-tertiary py-12 text-center">
          No jobs found.
        </p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-bg-elevated border border-border rounded-md p-4 flex items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {job.title}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5 truncate">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {job.source && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent/10 text-accent">
                      {job.source}
                    </span>
                  )}
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-[10px] font-medium rounded",
                      job.status === "open"
                        ? "bg-success/10 text-success"
                        : "bg-text-tertiary/10 text-text-tertiary"
                    )}
                  >
                    {job.status}
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    Posted {formatDate(job.posted_date)}
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    Seen {formatDate(job.first_seen_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {deleteConfirm === job.id ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-text-secondary">Are you sure?</span>
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={actionLoading === job.id}
                      className="px-2 py-1 text-xs font-medium text-white bg-destructive hover:bg-destructive/90 disabled:opacity-60 rounded transition-colors"
                    >
                      {actionLoading === job.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Yes"
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-secondary hover:bg-bg-secondary/80 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => openEdit(job)}
                      className="p-1.5 text-text-tertiary hover:text-accent rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(job.id)}
                      className="p-1.5 text-text-tertiary hover:text-destructive rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
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

      {/* Edit slide-over */}
      {editJob && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setEditJob(null)}
          />
          <div className="relative w-full max-w-md bg-bg-primary border-l border-border shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">
                Edit Job
              </h2>
              <button
                onClick={() => setEditJob(null)}
                className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <Field label="Title" value={editForm.title} onChange={(v) => setEditForm((f) => ({ ...f, title: v }))} />
              <Field label="Company" value={editForm.company} onChange={(v) => setEditForm((f) => ({ ...f, company: v }))} />
              <Field label="Location" value={editForm.location} onChange={(v) => setEditForm((f) => ({ ...f, location: v }))} />

              <div className="grid grid-cols-3 gap-3">
                <Field label="Salary min" value={editForm.salary_min} onChange={(v) => setEditForm((f) => ({ ...f, salary_min: v }))} type="number" />
                <Field label="Salary max" value={editForm.salary_max} onChange={(v) => setEditForm((f) => ({ ...f, salary_max: v }))} type="number" />
                <Field label="Currency" value={editForm.salary_currency} onChange={(v) => setEditForm((f) => ({ ...f, salary_currency: v }))} />
              </div>

              <Field label="Job URL" value={editForm.job_url} onChange={(v) => setEditForm((f) => ({ ...f, job_url: v }))} />

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full h-9 px-3 text-sm bg-bg-elevated border border-border rounded-md text-text-primary focus:border-accent focus:outline-none transition-colors"
                >
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                </select>
              </div>

              <Field label="Posted date" value={editForm.posted_date} onChange={(v) => setEditForm((f) => ({ ...f, posted_date: v }))} type="date" />

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:opacity-60 rounded-md transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-bg-elevated border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors"
      />
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        }
      >
        <AdminJobsContent />
      </Suspense>
    </div>
  );
}
