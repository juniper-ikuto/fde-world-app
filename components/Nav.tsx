"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Menu, X, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavProps {
  candidate?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

export default function Nav({ candidate }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = !!candidate;

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const initial = candidate?.name?.[0]?.toUpperCase() || candidate?.email?.[0]?.toUpperCase() || "?";

  return (
    <nav className="sticky top-0 z-50 h-14 border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="max-w-container mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-base font-semibold tracking-heading text-text-primary">
            FDE World
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/feed"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors duration-150",
              pathname === "/feed"
                ? "text-text-primary bg-bg-secondary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            )}
          >
            Browse Jobs
          </Link>

          {isAuthenticated && (
            <Link
              href="/saved"
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors duration-150 flex items-center gap-1.5",
                pathname === "/saved"
                  ? "text-text-primary bg-bg-secondary"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              )}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-secondary transition-colors duration-150"
              >
                <div className="w-7 h-7 rounded-full bg-accent-light text-accent text-xs font-semibold flex items-center justify-center">
                  {initial}
                </div>
                <span className="text-sm text-text-secondary">
                  {candidate?.name || candidate?.email}
                </span>
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-bg-elevated border border-border rounded-md shadow-md z-50 py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {candidate?.name}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">
                        {candidate?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors duration-150"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/signup"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-white bg-accent hover:bg-accent-hover px-4 py-1.5 rounded-md transition-colors duration-150"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-1.5 rounded-md hover:bg-bg-secondary transition-colors duration-150"
        >
          {mobileOpen ? (
            <X className="w-5 h-5 text-text-secondary" />
          ) : (
            <Menu className="w-5 h-5 text-text-secondary" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-bg-elevated animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/feed"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            >
              Browse Jobs
            </Link>

            {isAuthenticated && (
              <Link
                href="/saved"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              >
                Saved Jobs
              </Link>
            )}

            <div className="pt-2 border-t border-border mt-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              ) : (
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-accent"
                >
                  Sign up →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
