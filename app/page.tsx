import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import Nav from "@/components/Nav";
import HiringSignals from "@/components/HiringSignals";
import RoleFilterScroll from "@/components/RoleFilterScroll";
import {
  getJobStats,
  getRecentJobs,
  ROLE_LABELS,
  getJobCountsByRole,
} from "@/lib/db";
import { cn, timeAgo, extractDomain } from "@/lib/utils";
import type { Job } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [stats, recentJobs, roleCounts] = await Promise.all([
    getJobStats(),
    getRecentJobs(6),
    getJobCountsByRole(),
  ]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-container mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16">
          <div className="max-w-[620px]">

            {/* Eyebrow */}
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-5">
              Curated by Ikuto Group · FDE &amp; SE specialists
            </p>

            {/* Headline */}
            <h1 className="text-4xl sm:text-[52px] font-bold tracking-heading text-text-primary leading-[1.08]">
              Every FDE, SE and Solutions role.{" "}
              <span className="text-accent">One place.</span>
            </h1>

            {/* Subtext */}
            <p className="mt-5 text-lg text-text-secondary leading-relaxed max-w-[500px]">
              {stats.openJobs.toLocaleString()}+ open roles across{" "}
              {stats.companies.toLocaleString()}+ companies, updated daily. No noise,
              no generalist job board — just the roles that matter if you work in
              client-facing technical sales and delivery.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-md transition-colors duration-150"
              >
                Get free access
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 py-3"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none opacity-[0.035]"
          style={{
            background:
              "radial-gradient(circle at 60% 40%, #4F46E5, transparent 65%)",
          }}
        />
      </section>

      {/* ── Role type chips ───────────────────────────────────────────── */}
      <section className="border-t border-border py-8 bg-bg-elevated">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-4">
            Browse by role type
          </p>
          <RoleFilterScroll
            roles={Object.entries(ROLE_LABELS).map(([key, label]) => ({
              key,
              label,
              count: roleCounts[key] || 0,
            }))}
          />
        </div>
      </section>

      {/* ── Why this exists ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8 max-w-[860px]">
            <ValueProp
              heading="Curated, not scraped"
              body="Every role is client-facing and technical. FDEs, SEs, Pre-Sales, TAMs, Implementation Engineers. Nothing else makes the cut."
            />
            <ValueProp
              heading="Before it hits LinkedIn"
              body={`${stats.openJobs.toLocaleString()}+ live roles pulled daily from Greenhouse, Lever, Ashby and more — direct from company career pages.`}
            />
            <ValueProp
              heading="Backed by specialists"
              body="FDE World is run by Ikuto Group, who've placed hundreds of FDEs and SEs at Seed–Series B SaaS and AI companies."
            />
          </div>
        </div>
      </section>

      {/* ── Live roles teaser ─────────────────────────────────────────── */}
      <section className="pb-16 sm:pb-24 border-t border-border pt-16 sm:pt-20">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-heading text-text-primary">
                Live right now
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {stats.openJobs.toLocaleString()} open roles · updated daily
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Blurred cards */}
            <div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              style={{ filter: "blur(3px)", userSelect: "none", pointerEvents: "none" }}
            >
              {recentJobs.map((job) => (
                <TeaserCard key={job.url} job={job} />
              ))}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-bg-primary/90 backdrop-blur-sm rounded-lg px-8 py-6 border border-border shadow-lg">
                <p className="text-sm text-text-secondary mb-4">
                  Free access. No credit card. 60 seconds to sign up.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-md transition-colors duration-150"
                >
                  See all {stats.openJobs.toLocaleString()} roles
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hiring Signals ───────────────────────────────────────────── */}
      <HiringSignals />

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="bg-text-primary py-16 sm:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-heading text-white mb-3">
            The FDE &amp; SE job board you&apos;ve been missing.
          </h2>
          <p className="text-zinc-400 mb-8 text-sm max-w-[400px] mx-auto leading-relaxed">
            Free to join. Upload your CV, set your preferences, and let the right
            roles find you.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-md transition-colors duration-150"
          >
            Get free access
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-text-primary">
              FDE World
            </span>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Powered by Ikuto Group · Specialist SE &amp; FDE recruiters
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/feed" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150">
              Browse Roles
            </Link>
            <Link href="/signup" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150">
              Join
            </Link>
            <Link href="/privacy" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150">
              Privacy
            </Link>
            <Link href="/employers" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150">
              Post a Job
            </Link>
          </div>
        </div>
        <div className="max-w-container mx-auto px-4 sm:px-6 mt-6 pt-4 border-t border-border">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} FDE World. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ValueProp({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <div className="w-8 h-0.5 bg-accent rounded-full mb-4" />
      <h3 className="text-base font-semibold text-text-primary mb-2">{heading}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}

function TeaserCard({ job }: { job: Job }) {
  const domain = job.domain || extractDomain(job.url);
  const logoUrl = domain ? `/api/logo?domain=${domain}` : null;
  const companyInitial = job.company?.[0]?.toUpperCase() || "?";
  const ago = timeAgo(job.posted_date || job.first_seen_at);

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4">
      <div className="flex gap-3">
        <div className="shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
          <p className="text-sm font-semibold text-text-primary truncate">
            {job.title}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">{job.company}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {job.location && (
              <span className={cn("flex items-center gap-0.5 text-xs text-text-tertiary")}>
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[140px]">{job.location}</span>
              </span>
            )}
            {ago && (
              <span className="text-xs text-text-tertiary ml-auto">{ago}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
