"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Users, Briefcase, Building2, LogOut } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Check if we have a valid session by hitting an admin API
    const check = async () => {
      try {
        const res = await fetch("/api/admin/candidates?limit=1");
        if (res.ok) {
          setAuthorized(true);
        } else {
          router.replace("/admin/login");
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.replace("/admin/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold tracking-heading text-text-primary">
              FDE World Admin
            </h1>
            <p className="text-sm text-text-tertiary mt-1">Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-elevated border border-border rounded-md hover:border-accent/40 disabled:opacity-60 transition-colors"
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            Logout
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/jobs"
            className="bg-bg-elevated border border-border rounded-md p-5 hover:border-accent/40 transition-colors group"
          >
            <Briefcase className="w-6 h-6 text-accent mb-3" />
            <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              Jobs
            </h2>
            <p className="text-xs text-text-tertiary mt-1">
              Search, edit and manage job listings
            </p>
          </Link>

          <Link
            href="/admin/candidates"
            className="bg-bg-elevated border border-border rounded-md p-5 hover:border-accent/40 transition-colors group"
          >
            <Users className="w-6 h-6 text-accent mb-3" />
            <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              Candidates
            </h2>
            <p className="text-xs text-text-tertiary mt-1">
              View registered candidates and CVs
            </p>
          </Link>

          <Link
            href="/admin/employers"
            className="bg-bg-elevated border border-border rounded-md p-5 hover:border-accent/40 transition-colors group"
          >
            <Building2 className="w-6 h-6 text-accent mb-3" />
            <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              Employer Submissions
            </h2>
            <p className="text-xs text-text-tertiary mt-1">
              Review and approve job submissions
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
