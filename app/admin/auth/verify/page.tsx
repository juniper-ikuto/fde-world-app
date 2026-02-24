"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, XCircle } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(true);
      return;
    }

    // The API route handles redirect on success, so we just need to make
    // the browser navigate to the API endpoint
    window.location.href = `/api/admin/auth/verify?token=${token}`;
  }, [token]);

  if (error) {
    return (
      <div className="flex items-center justify-center px-4 py-20 sm:py-32">
        <div className="text-center max-w-[400px]">
          <XCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
            Link expired
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            This login link is invalid or has already been used.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-md transition-colors duration-150"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-20 sm:py-32">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
          Verifying your link...
        </h1>
        <p className="text-sm text-text-secondary">
          Hang tight, this will only take a moment.
        </p>
      </div>
    </div>
  );
}

export default function AdminVerifyPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Suspense
        fallback={
          <div className="flex items-center justify-center px-4 py-20 sm:py-32">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
