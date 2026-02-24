"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, Mail, AlertCircle } from "lucide-react";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      await fetch("/api/admin/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-20 sm:py-32">
      <div className="text-center max-w-[400px]">
        {error === "invalid" && !sent && (
          <div className="mb-6 flex items-center gap-2 justify-center text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>That link has expired or already been used. Request a new one.</span>
          </div>
        )}

        {!sent ? (
          <>
            <Mail className="w-10 h-10 text-accent mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-1">
              FDE World Admin
            </h1>
            <p className="text-sm text-text-tertiary mb-6">Admin access only</p>
            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <input
                type="email"
                placeholder="admin@email.com"
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
                Send login link
              </button>
            </form>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
              Check your email
            </h1>
            <p className="text-sm text-text-secondary">
              If that address is authorised, a login link is on its way.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Suspense
        fallback={
          <div className="flex items-center justify-center px-4 py-20 sm:py-32">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
          </div>
        }
      >
        <AdminLoginContent />
      </Suspense>
    </div>
  );
}
