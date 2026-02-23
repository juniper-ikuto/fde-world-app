"use client";

import { useEffect, useCallback, useState } from "react";
import {
  X,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn, timeAgo, extractDomain, getSourceLabel, getFundingBadgeColors } from "@/lib/utils";
import type { Job } from "@/lib/db";

interface JobDrawerProps {
  job: Job | null;
  onClose: () => void;
}

export default function JobDrawer({ job, onClose }: JobDrawerProps) {
  const [descriptionHtml, setDescriptionHtml] = useState<string | null>(null);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (job) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [job, handleEscape]);

  // Fetch job description when drawer opens
  useEffect(() => {
    if (!job) {
      setDescriptionHtml(null);
      setDescriptionError(false);
      return;
    }

    let cancelled = false;
    setDescriptionLoading(true);
    setDescriptionHtml(null);
    setDescriptionError(false);

    const params = new URLSearchParams({ url: job.url });
    if (job.source) params.set("source", job.source);

    fetch(`/api/jobs/detail?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.description_html) {
          setDescriptionHtml(data.description_html);
        } else {
          setDescriptionError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setDescriptionError(true);
      })
      .finally(() => {
        if (!cancelled) setDescriptionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [job]);

  if (!job) return null;

  const domain = job.domain || extractDomain(job.url);
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null;
  const fundingColors = getFundingBadgeColors(job.funding_stage || null);
  const sourceLabel = getSourceLabel(job.source);
  const postedAgo = timeAgo(job.posted_date || job.first_seen_at);
  const companyInitial = job.company?.[0]?.toUpperCase() || "?";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-full sm:w-[480px] bg-bg-elevated border-l border-border shadow-lg animate-slide-in-right flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Job details: ${job.title} at ${job.company}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex gap-3 min-w-0">
            <div className="shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${job.company} logo`}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-sm bg-bg-secondary object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={cn(
                  "w-12 h-12 rounded-sm bg-accent-light text-accent text-lg font-semibold items-center justify-center",
                  logoUrl ? "hidden" : "flex"
                )}
              >
                {companyInitial}
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-text-primary tracking-heading leading-tight">
                {job.title}
              </h2>
              <p className="text-sm font-medium text-text-secondary mt-1">
                {job.company}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors duration-150 shrink-0 ml-2"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta info */}
          <div className="space-y-2.5">
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-text-tertiary shrink-0" />
                <span>{job.location}</span>
                {job.is_remote ? (
                  <span className="text-success font-medium text-xs">
                    · Remote
                  </span>
                ) : null}
              </div>
            )}

            {job.salary_range && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <DollarSign className="w-4 h-4 text-text-tertiary shrink-0" />
                <span>{job.salary_range}</span>
              </div>
            )}

            {postedAgo && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Calendar className="w-4 h-4 text-text-tertiary shrink-0" />
                <span>Posted {postedAgo}</span>
                {sourceLabel && (
                  <span className="text-text-tertiary">
                    · via {sourceLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Funding / company info */}
          {(job.funding_stage || job.total_raised || job.employee_count) && (
            <div className="border border-border rounded-md p-4 space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-caps text-text-tertiary">
                Company Info
              </h3>

              <div className="flex flex-wrap gap-2">
                {fundingColors && (
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1",
                      fundingColors.bg,
                      fundingColors.text
                    )}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {job.funding_stage}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {job.total_raised && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <DollarSign className="w-3.5 h-3.5 text-text-tertiary" />
                    Raised {job.total_raised}
                  </div>
                )}
                {job.employee_count && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Users className="w-3.5 h-3.5 text-text-tertiary" />
                    {job.employee_count} employees
                  </div>
                )}
                {job.last_funded_date && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                    Last funded {job.last_funded_date}
                  </div>
                )}
              </div>

              {job.description && (
                <p className="text-sm text-text-secondary leading-relaxed pt-1">
                  {job.description}
                </p>
              )}
            </div>
          )}

          {/* Job description — fetched on demand */}
          {descriptionLoading ? (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-caps text-text-tertiary">
                About this role
              </h3>
              <div className="space-y-2">
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-5/6 skeleton rounded" />
                <div className="h-4 w-4/6 skeleton rounded" />
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-3/4 skeleton rounded" />
                <div className="h-4 w-5/6 skeleton rounded" />
              </div>
            </div>
          ) : descriptionHtml ? (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-caps text-text-tertiary">
                About this role
              </h3>
              <div
                className="text-sm text-text-secondary leading-relaxed prose-drawer"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          ) : descriptionError || !job.description_snippet ? (
            <div className="border border-border rounded-md p-4 text-center">
              <Building2 className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">
                For full details, view on the company&apos;s website.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-caps text-text-tertiary">
                About this role
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {job.description_snippet}
              </p>
            </div>
          )}

          {/* Industries */}
          {job.industries && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-caps text-text-tertiary">
                Industries
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.industries.split(",").map((ind) => (
                  <span
                    key={ind.trim()}
                    className="px-2 py-0.5 text-xs text-text-secondary bg-bg-secondary rounded-full"
                  >
                    {ind.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="border-t border-border p-5">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-md transition-colors duration-150"
          >
            Apply for this role
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs text-text-tertiary text-center mt-2">
            Opens on company website
          </p>
        </div>
      </div>
    </>
  );
}
