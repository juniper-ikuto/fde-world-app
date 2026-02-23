"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Nav from "@/components/Nav";

export default function CheckEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("signup_email");
    if (stored) setEmail(stored);
  }, []);

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);

    try {
      await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: "", roleTypes: [] }),
      });
      setResent(true);
    } catch {
      // silently fail
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="flex items-center justify-center px-4 py-20 sm:py-32">
        <div className="text-center max-w-[400px]">
          {/* Envelope SVG */}
          <div className="w-16 h-16 mx-auto mb-6 text-text-tertiary">
            <svg
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <rect x="4" y="14" width="56" height="36" rx="3" />
              <polyline points="4,14 32,38 60,14" />
              <line x1="4" y1="50" x2="24" y2="32" />
              <line x1="60" y1="50" x2="40" y2="32" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold tracking-heading text-text-primary mb-2">
            Check your inbox
          </h1>

          <p className="text-sm text-text-secondary mb-1">
            We&apos;ve sent a sign-in link to
          </p>
          {email && (
            <p className="text-sm font-medium text-text-primary mb-4">
              {email}
            </p>
          )}
          <p className="text-sm text-text-secondary mb-1">
            Click the link in the email to access your personalised job feed.
          </p>
          <p className="text-xs text-text-tertiary mb-8">
            (Link expires in 24 hours)
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-50"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              {resent ? "Link resent" : "Resend link"}
            </button>
            <Link
              href="/signup"
              className="text-sm text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              Try a different email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
