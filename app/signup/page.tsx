"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Upload, X } from "lucide-react";
import Nav from "@/components/Nav";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { key: "se", label: "Solutions Engineer" },
  { key: "fde", label: "Forward Deployed Engineer" },
  { key: "presales", label: "Pre-Sales / Sales Engineer" },
  { key: "tam", label: "Technical Account Manager" },
  { key: "impl", label: "Implementation Engineer" },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [location, setLocation] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("CV file must be under 5MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("CV must be a PDF or Word document");
      return;
    }

    setError(null);
    setCvFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!linkedinUrl.trim() && !cvFile) {
      setError("Please add your LinkedIn profile URL or upload your CV \u2014 we need at least one to verify you work in this space.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email.trim().toLowerCase());
      formData.append("name", name.trim());
      formData.append("surname", surname.trim());
      formData.append("roleTypes", JSON.stringify(selectedRoles));

      if (location.trim()) {
        formData.append("location", location.trim());
      }

      if (linkedinUrl.trim()) {
        formData.append("linkedin_url", linkedinUrl.trim());
      }

      if (cvFile) {
        formData.append("cv", cvFile);
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Store email for check-email page
      sessionStorage.setItem("signup_email", email.trim());
      router.push("/check-email");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-[480px]">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold tracking-heading text-text-primary">
              FDE World
            </h1>
          </div>

          {/* Card */}
          <div className="bg-bg-elevated border border-border rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-semibold tracking-heading text-text-primary mb-1">
              Join FDE World
            </h2>
            <p className="text-sm text-text-secondary mb-1">
              60 seconds. No password. Free forever.
            </p>
            <p className="text-xs text-text-tertiary mb-6">
              You&apos;ll receive job alerts matching your preferences and occasional FDE World updates.{" "}
              Unsubscribe any time.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                />
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  First name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane"
                  className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                />
              </div>

              {/* Surname */}
              <div>
                <label
                  htmlFor="surname"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  Last name
                </label>
                <input
                  id="surname"
                  type="text"
                  required
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Smith"
                  className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                />
              </div>

              {/* Location (optional) */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  Where are you based?{" "}
                  <span className="text-text-tertiary font-normal">(optional)</span>
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. London, UK"
                  className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                />
              </div>

              {/* Role type chips */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  I&apos;m interested in
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => toggleRole(role.key)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md border transition-all duration-100",
                        selectedRoles.includes(role.key)
                          ? "bg-accent text-white border-accent"
                          : "bg-bg-secondary border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
                      )}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LinkedIn URL */}
              <div>
                <label
                  htmlFor="linkedin"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  LinkedIn profile URL
                </label>
                <input
                  id="linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full h-10 px-3 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-150"
                />
              </div>

              {/* CV Upload */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Upload your CV{" "}
                  <span className="text-text-tertiary font-normal">(PDF/Word)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {cvFile ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-md">
                    <Upload className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-sm text-text-primary truncate flex-1">
                      {cvFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCvFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-0.5 rounded hover:bg-bg-primary text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border border-dashed rounded-md text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-150"
                  >
                    <Upload className="w-4 h-4" />
                    Choose file...
                  </button>
                )}
                <p className="text-xs text-text-tertiary mt-1">
                  PDF or Word, max 5MB
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Please provide at least one of: LinkedIn profile URL or CV
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {/* Consent */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-xs text-zinc-500 leading-relaxed">
                  I agree to the{" "}
                  <Link
                    href="/privacy"
                    className="underline hover:text-text-secondary transition-colors duration-150"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and consent to my personal data being stored and processed to
                  power my FDE World profile and job alerts.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !consent}
                className="w-full flex items-center justify-center gap-2 h-11 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium text-sm rounded-md transition-colors duration-150"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Join FDE World
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-text-tertiary mt-4 leading-relaxed">
              We&apos;ll send you a magic sign-in link. No password needed. FDE
              World is run by Ikuto Group, a specialist SE/FDE recruiter.{" "}
              <Link
                href="/privacy"
                className="underline hover:text-text-secondary transition-colors duration-150"
              >
                Privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
