"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle2, Shield, Users, Zap } from "lucide-react";
import Nav from "@/components/Nav";

export default function EmployersPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Redirect if already signed in
  useEffect(() => {
    fetch("/api/employer/me")
      .then((r) => {
        if (r.ok) router.push("/employer/dashboard");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/employer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company_name: companyName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="max-w-container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center max-w-[600px] mx-auto mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-heading text-text-primary mb-3">
            Post your FDE role directly to the community
          </h1>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Sign up free. Submit a link to your job. We verify and list it with
            a <span className="font-medium text-amber-700">Direct from [Company]</span> badge.
          </p>
        </div>

        {/* Value props */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-[720px] mx-auto mb-12 sm:mb-16">
          <div className="text-center">
            <div className="w-10 h-10 rounded-md bg-accent-light text-accent flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Free to post</h3>
            <p className="text-sm text-text-secondary">
              No fees, no contracts. Just submit your job URL.
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-md bg-accent-light text-accent flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Verified listing</h3>
            <p className="text-sm text-text-secondary">
              We review every submission to maintain quality.
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-md bg-accent-light text-accent flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Reach active FDEs</h3>
            <p className="text-sm text-text-secondary">
              Connect with forward deployed engineers actively looking.
            </p>
          </div>
        </div>

        {/* Sign-up form */}
        <div className="max-w-[440px] mx-auto">
          <div className="bg-bg-elevated border border-border rounded-lg p-6 sm:p-8 shadow-sm">
            {!sent ? (
              <>
                <h2 className="text-xl font-semibold tracking-heading text-text-primary mb-1">
                  Get started
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                  We&apos;ll send you a magic link to access your dashboard.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="emp-name" className="block text-sm font-medium text-text-primary mb-1.5">
                      Your name
                    </label>
                    <input
                      id="emp-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label htmlFor="emp-company" className="block text-sm font-medium text-text-primary mb-1.5">
                      Company name
                    </label>
                    <input
                      id="emp-company"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label htmlFor="emp-email" className="block text-sm font-medium text-text-primary mb-1.5">
                      Work email
                    </label>
                    <input
                      id="emp-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 h-11 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium text-sm rounded-md transition-colors duration-150"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Get started
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-4" />
                <h2 className="text-xl font-semibold tracking-heading text-text-primary mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-text-secondary">
                  We&apos;ve sent a sign-in link to <span className="font-medium text-text-primary">{email}</span>.
                  Click the link to access your employer dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
