"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import Nav from "@/components/Nav";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Token verify states
  const [status, setStatus] = useState<"loading" | "success" | "error" | "signin">(
    token ? "loading" : "signin"
  );
  const [error, setError] = useState<string | null>(null);

  // Sign-in form states
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setError(data.error || "Invalid or expired link");
          return;
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/feed");
        }, 1500);
      } catch {
        setStatus("error");
        setError("Something went wrong");
      }
    };

    verify();
  }, [token, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true); // show success either way to prevent enumeration
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-20 sm:py-32">
      <div className="text-center max-w-[400px]">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
              Verifying your link...
            </h1>
            <p className="text-sm text-text-secondary">
              Hang tight, this will only take a moment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
              You&apos;re in!
            </h1>
            <p className="text-sm text-text-secondary">
              Redirecting you to your personalised job feed...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
              Link expired or invalid
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              {error || "This sign-in link is no longer valid."}
            </p>
            <button
              onClick={() => setStatus("signin")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-md transition-colors duration-150"
            >
              Request a new link
            </button>
          </>
        )}

        {status === "signin" && (
          <>
            <Mail className="w-10 h-10 text-accent mx-auto mb-4" />
            {!sent ? (
              <>
                <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
                  Sign in to FDE World
                </h1>
                <p className="text-sm text-text-secondary mb-6">
                  Enter your email and we&apos;ll send you a sign-in link.
                </p>
                <form onSubmit={handleSignIn} className="space-y-3 text-left">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium text-sm rounded-md transition-colors duration-150"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Send sign-in link
                  </button>
                </form>
                <p className="text-xs text-text-tertiary mt-4">
                  Not a member yet?{" "}
                  <Link href="/signup" className="text-accent hover:underline">
                    Join free
                  </Link>
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-4" />
                <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
                  Check your email
                </h1>
                <p className="text-sm text-text-secondary">
                  If that address is registered, a sign-in link is on its way.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />
      <Suspense
        fallback={
          <div className="flex items-center justify-center px-4 py-20 sm:py-32">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </div>
  );
}
