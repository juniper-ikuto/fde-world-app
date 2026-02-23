import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Nav from "@/components/Nav";
import {
  getJobStats,
  getJobCountsByRole,
  getRecentJobs,
  getFeaturedJobs,
  ROLE_LABELS,
} from "@/lib/db";
import {
  cn,
  timeAgo,
  isNew,
  extractDomain,
  getSourceLabel,
  getFundingBadgeColors,
} from "@/lib/utils";
import type { Job } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [stats, roleCounts, recentJobs, featuredJobs] = await Promise.all([
    getJobStats(),
    getJobCountsByRole(),
    getRecentJobs(6),
    getFeaturedJobs(),
  ]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-container mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
          <div className="max-w-[640px]">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-heading text-text-primary leading-[1.1]">
              The world is built by the people who deploy it.
            </h1>

            <p className="mt-5 text-lg text-text-secondary leading-relaxed max-w-[480px]">
              FDE World is building the definitive community for Forward Deployed Engineers, Solutions Engineers, and the people shaping how great software reaches the world. Join 000+ members.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium text-base rounded-md transition-colors duration-150"
              >
                Join FDE World
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 py-3"
              >
                Browse open roles
              </Link>
            </div>

            <p className="mt-6 text-sm text-text-tertiary">
              Members at Brex, Glean, Writer, Scale AI, Anthropic, and 340+ more companies
            </p>
          </div>
        </div>

        {/* Subtle decorative gradient */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, #4F46E5, transparent 70%)",
          }}
        />
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-bg-elevated">
        <div className="max-w-container mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            <StatBlock
              icon={<Briefcase className="w-4 h-4" />}
              value={`${stats.openJobs.toLocaleString()}+`}
              label="Open Roles"
            />
            <StatBlock
              icon={<Building2 className="w-4 h-4" />}
              value="340+"
              label="Companies"
            />
            <StatBlock
              icon={<MapPin className="w-4 h-4" />}
              value="5 Specialisms"
              label="SE · FDE · TAM · Pre-Sales"
            />
            <StatBlock
              icon={<Clock className="w-4 h-4" />}
              value="Daily"
              label="Updated"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-heading text-text-primary text-center mb-10">
            How it works
          </h2>

          <div className="grid sm:grid-cols-3 gap-6 max-w-[800px] mx-auto">
            <StepCard
              emoji="🤝"
              title="Join the community"
              description="Create your profile in 60 seconds. Tell us what you do and where you are in your FDE journey."
              step={1}
            />
            <StepCard
              emoji="🔍"
              title="Access every open role"
              description="Every SE/FDE/TAM opening across 340+ companies, updated daily. Before it hits LinkedIn."
              step={2}
            />
            <StepCard
              emoji="🔔"
              title="Grow with the network"
              description="Weekly insights, direct introductions from Ikuto, and a community of people who get what you do."
              step={3}
            />
          </div>
        </div>
      </section>

      {/* Browse by role type */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-heading text-text-primary text-center mb-8">
            Browse by role type
          </h2>

          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/feed?role=${key}`}
                className="group flex items-center gap-3 px-5 py-3.5 bg-bg-secondary border border-border rounded-md hover:bg-bg-elevated hover:border-border-hover hover:shadow-md hover:-translate-y-px transition-all duration-150"
              >
                <span className="text-sm font-medium text-text-primary">
                  {label}
                </span>
                <span className="text-sm tabular-nums text-text-tertiary font-mono">
                  {(roleCounts[key] || 0).toLocaleString()} roles
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Roles — only if featured jobs exist */}
      {featuredJobs.length > 0 && (
        <section className="pb-16 sm:pb-20">
          <div className="max-w-container mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-heading text-text-primary text-center mb-8 flex items-center justify-center gap-2">
              <span className="text-amber-500">✦</span>
              Featured Roles
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 max-w-[900px] mx-auto">
              {featuredJobs.map((job) => (
                <FeaturedJobCard key={job.url} job={job} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live Roles — blurred teaser */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold tracking-heading text-text-primary">
              Live right now
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Updated daily from 340+ companies
            </p>
          </div>

          <div className="relative">
            {/* Blurred job cards */}
            <div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[900px] mx-auto"
              style={{
                filter: "blur(4px)",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {recentJobs.map((job) => (
                <TeaserJobCard key={job.url} job={job} />
              ))}
            </div>

            {/* Overlay CTA */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-bg-primary/80 backdrop-blur-sm rounded-lg px-8 py-6 border border-border shadow-lg">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium text-base rounded-md transition-colors duration-150"
                >
                  Join to see all {stats.openJobs.toLocaleString()} roles
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA repeat */}
      <section className="bg-text-primary py-16 sm:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-heading text-white mb-4">
            Ready to join FDE World?
          </h2>
          <p className="text-text-tertiary mb-8 text-sm">
            The community for the people who deploy great software.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium text-base rounded-md transition-colors duration-150"
            >
              Join FDE World
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="text-sm text-text-tertiary hover:text-white transition-colors duration-150"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  FDE World
                </span>
                <span className="text-xs text-text-tertiary">
                  The community for the people who deploy great software.
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-1">
                Powered by Ikuto
              </p>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/feed"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
              >
                Browse Roles
              </Link>
              <Link
                href="/signup"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
              >
                Join the Network
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-text-tertiary">
              &copy; {new Date().getFullYear()} FDE World. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatBlock({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-accent-light text-accent flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums tracking-heading text-accent font-mono">
          {value}
        </p>
        {label && <p className="text-xs text-text-secondary">{label}</p>}
      </div>
    </div>
  );
}

function StepCard({
  emoji,
  title,
  description,
  step,
}: {
  emoji: string;
  title: string;
  description: string;
  step: number;
}) {
  return (
    <div className="relative bg-bg-elevated border border-border rounded-md p-5 hover:border-border-hover hover:shadow-sm transition-all duration-150">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">{emoji}</span>
        <span className="text-xs font-medium text-text-tertiary">
          Step {step}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function FeaturedJobCard({ job }: { job: Job }) {
  const domain = job.domain || extractDomain(job.url);
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null;
  const fundingColors = getFundingBadgeColors(job.funding_stage || null);
  const sourceLabel = getSourceLabel(job.source);
  const postedAgo = timeAgo(job.posted_date || job.first_seen_at);
  const companyInitial = job.company?.[0]?.toUpperCase() || "?";

  return (
    <div className="relative bg-bg-elevated border border-border rounded-md p-4 sm:p-5 hover:border-border-hover hover:shadow-md hover:-translate-y-px transition-all duration-150">
      {/* Featured badge */}
      <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 rounded-full">
        Featured
      </span>

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
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
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
          <h3 className="text-base font-semibold text-text-primary truncate pr-16">
            {job.title}
          </h3>
          <p className="text-sm font-medium text-text-secondary mt-0.5">
            {job.company}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {job.location && (
              <span className="flex items-center gap-1 text-sm text-text-secondary">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[200px]">{job.location}</span>
                {job.is_remote ? (
                  <span className="text-success font-medium text-xs ml-0.5">
                    · Remote
                  </span>
                ) : null}
              </span>
            )}
            {job.salary_range && (
              <span className="text-sm text-text-secondary">
                {job.salary_range}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {fundingColors && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  fundingColors.bg,
                  fundingColors.text
                )}
              >
                {job.funding_stage}
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
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
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

function TeaserJobCard({ job }: { job: Job }) {
  const domain = job.domain || extractDomain(job.url);
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null;
  const companyInitial = job.company?.[0]?.toUpperCase() || "?";

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4">
      <div className="flex gap-3">
        <div className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              width={36}
              height={36}
              className="w-9 h-9 rounded-sm bg-bg-secondary object-contain"
            />
          ) : (
            <div className="w-9 h-9 rounded-sm bg-accent-light text-accent text-sm font-semibold flex items-center justify-center">
              {companyInitial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {job.title}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">{job.company}</p>
          {job.location && (
            <p className="text-xs text-text-tertiary mt-1 truncate">
              {job.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
