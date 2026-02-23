"use client";

import { Heart, ExternalLink, MapPin } from "lucide-react";
import { cn, timeAgo, isNew, extractDomain, getSourceLabel, getFundingBadgeColors } from "@/lib/utils";
import { BetaBadge } from "./BetaBadge";
import type { Job } from "@/lib/db";

function extractCompanyDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    // Handle second-level TLDs like .co.uk, .com.au
    const sld = parts[parts.length - 2];
    if (['co', 'com', 'org', 'net', 'gov'].includes(sld) && parts[parts.length - 1].length === 2) {
      return parts.slice(-3).join('.');
    }
    // Strip subdomains (careers.brex.com → brex.com)
    return parts.slice(-2).join('.');
  } catch {
    return '';
  }
}

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onSave?: (jobUrl: string) => void;
  onUnsave?: (jobUrl: string) => void;
  onClick?: (job: Job) => void;
  isAuthenticated?: boolean;
}

export default function JobCard({
  job,
  isSaved = false,
  onSave,
  onUnsave,
  onClick,
  isAuthenticated = false,
}: JobCardProps) {
  const companyDomain = job.company_url ? extractCompanyDomain(job.company_url) : '';
  // Priority: custom career site > Crunchbase domain > nothing (skip ATS domains)
  const domain = companyDomain || job.domain || null;
  const logoUrl = domain ? `/api/logo?domain=${encodeURIComponent(domain)}` : null;
  const jobIsNew = isNew(job.posted_date) || isNew(job.first_seen_at);
  const postedAgo = timeAgo(job.posted_date || job.first_seen_at);
  const fundingColors = getFundingBadgeColors(job.funding_stage || null);
  const sourceLabel = getSourceLabel(job.source);
  const companyInitial = job.company?.[0]?.toUpperCase() || "?";

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      onUnsave?.(job.url);
    } else {
      onSave?.(job.url);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => onClick?.(job)}
      className={cn(
        "group relative bg-bg-elevated border border-border rounded-md p-4 sm:p-5",
        "transition-all duration-150 ease-out",
        "hover:border-border-hover hover:shadow-md hover:-translate-y-px",
        onClick && "cursor-pointer"
      )}
    >
      {/* Save button — top right */}
      {isAuthenticated && (
        <button
          onClick={handleSaveClick}
          className={cn(
            "absolute top-4 right-4 p-1.5 rounded-md transition-all duration-200",
            isSaved
              ? "text-accent"
              : "text-text-tertiary hover:text-accent opacity-0 group-hover:opacity-100"
          )}
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          <Heart
            className={cn("w-4 h-4", isSaved && "fill-current")}
          />
        </button>
      )}

      <div className="flex gap-3 sm:gap-4">
        {/* Company logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${job.company} logo`}
              width={40}
              height={40}
              className="w-10 h-10 rounded-sm bg-bg-secondary object-contain"
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
              "w-10 h-10 rounded-sm bg-accent-light text-accent text-sm font-semibold items-center justify-center",
              logoUrl ? "hidden" : "flex"
            )}
          >
            {companyInitial}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {/* Title */}
              <h3 className="text-base font-semibold text-text-primary truncate pr-8">
                {job.title}
              </h3>
              {/* Company */}
              <p className="text-sm font-medium text-text-secondary mt-0.5">
                {job.company}
              </p>
            </div>
          </div>

          {/* Location + salary row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {job.location && (
              <span className="flex items-center gap-1 text-sm text-text-secondary">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {job.location}
                </span>
                {job.is_remote ? (
                  <span className="text-success font-medium text-xs ml-0.5">
                    · Remote
                  </span>
                ) : null}
              </span>
            )}
            {!job.location && job.is_remote ? (
              <span className="flex items-center gap-1 text-sm text-success font-medium">
                <MapPin className="w-3.5 h-3.5" />
                Remote
              </span>
            ) : null}
            {job.salary_range && (
              <span className="text-sm text-text-secondary">
                {job.salary_range}
                <BetaBadge />
              </span>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {jobIsNew && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-success bg-success/10 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                NEW
              </span>
            )}

            {fundingColors && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  fundingColors.bg,
                  fundingColors.text
                )}
              >
                {job.funding_stage}
                <sup className="text-[8px] ml-0.5 opacity-70" title="This data is not yet available for all roles">&beta;</sup>
              </span>
            )}

            {sourceLabel && (
              <span className="text-xs text-text-tertiary">
                via {sourceLabel}
              </span>
            )}

            {postedAgo && (
              <span className="text-xs text-text-tertiary">{postedAgo}</span>
            )}

            {/* Apply link */}
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleApplyClick}
              className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150"
            >
              Apply
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-sm skeleton" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 skeleton rounded" />
          <div className="h-4 w-1/3 skeleton rounded" />
          <div className="h-4 w-1/2 skeleton rounded" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 w-16 skeleton rounded-full" />
            <div className="h-5 w-20 skeleton rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
