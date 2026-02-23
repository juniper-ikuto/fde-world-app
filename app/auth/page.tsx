"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Nav from "@/components/Nav";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No token provided");
      return;
    }

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
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-md transition-colors duration-150"
            >
              Request a new link
            </Link>
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
