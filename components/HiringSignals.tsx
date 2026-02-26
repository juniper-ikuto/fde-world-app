"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Signal {
  id: number;
  tweet_id: string;
  author_username: string;
  author_name: string;
  author_followers: number;
  text: string;
  created_at: string;
  url: string;
  score: number;
  company_name: string | null;
  role_extracted: string | null;
  is_target_stage: number;
  discovered_at: string;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function signalTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 5
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 4
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold rounded-full border",
        color
      )}
    >
      {"★".repeat(score)}
    </span>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const displayName = signal.company_name || signal.author_name;
  const hasRole = signal.role_extracted && signal.role_extracted.length > 0;

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4 sm:p-5 hover:border-border-hover hover:shadow-sm transition-all duration-150">
      {/* Top row: score + stage badge */}
      <div className="flex items-center gap-2 mb-3">
        <ScoreBadge score={signal.score} />
        {signal.is_target_stage === 1 && (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200">
            Seed–Series B
          </span>
        )}
      </div>

      {/* Company / role */}
      <div className="mb-2">
        <p className="text-sm font-semibold text-text-primary">{displayName}</p>
        {hasRole && (
          <p className="text-xs text-text-secondary mt-0.5">
            {signal.role_extracted}
          </p>
        )}
      </div>

      {/* Tweet text (clamped to 3 lines) */}
      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-3">
        {signal.text}
      </p>

      {/* Footer: author + link + time */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-tertiary truncate">
          @{signal.author_username} · {formatFollowers(signal.author_followers)}{" "}
          followers
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-text-tertiary">
            {signalTimeAgo(signal.discovered_at)}
          </span>
          <a
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors duration-150"
          >
            View on X
          </a>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 6;

export default function HiringSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;

    async function fetchSignals() {
      try {
        const res = await fetch("/api/signals/feed");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSignals(data);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSignals();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSignals, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Don't render section if no signals and done loading
  if (!loading && signals.length === 0) return null;

  const shown = signals.slice(0, visible);
  const hasMore = visible < signals.length;

  return (
    <section className="py-16 sm:py-20 border-t border-border">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold tracking-heading text-text-primary">
                Hiring signals from X
              </h2>
              <span className="text-lg" aria-hidden="true">
                📡
              </span>
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse">
                Building
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              Real-time posts from founders and companies actively hiring FDEs and
              Solutions Engineers.
            </p>
            <p className="text-[11px] text-text-tertiary mt-1">Powered by X</p>
          </div>
          {!loading && signals.length > 0 && (
            <span className="text-xs text-text-tertiary shrink-0 mt-1">
              {signals.length} signal{signals.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-bg-elevated border border-border rounded-md p-4 sm:p-5"
              >
                <div className="skeleton h-5 w-16 rounded mb-3" />
                <div className="skeleton h-4 w-32 rounded mb-2" />
                <div className="skeleton h-12 w-full rounded mb-3" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Signal cards */}
        {!loading && signals.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.map((signal) => (
                <SignalCard key={signal.tweet_id} signal={signal} />
              ))}
            </div>

            {/* Load more / Show less */}
            <div className="mt-6 flex items-center justify-center gap-4">
              {hasMore && (
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150 border border-border rounded-md px-4 py-2 hover:bg-bg-elevated"
                >
                  Show more ({signals.length - visible} remaining)
                </button>
              )}
              {visible > PAGE_SIZE && (
                <button
                  onClick={() => setVisible(PAGE_SIZE)}
                  className="text-sm text-text-tertiary hover:text-text-secondary transition-colors duration-150"
                >
                  Show less
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
