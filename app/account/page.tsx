"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Bookmark, Loader2, AlertTriangle } from "lucide-react";
import Nav from "@/components/Nav";
import Link from "next/link";

const ROLE_OPTIONS = [
  { key: "fde", label: "Forward Deployed Engineer" },
  { key: "se", label: "Solutions Engineer" },
  { key: "tam", label: "Technical Account Manager" },
  { key: "presales", label: "Pre-Sales / Sales Engineer" },
  { key: "impl", label: "Implementation Engineer" },
];

interface Profile {
  id: number;
  email: string;
  name: string | null;
  role_types: string | null;
  remote_pref: string | null;
  alert_freq: string | null;
  created_at: string | null;
  savedCount: number;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form state
  const [roleTypes, setRoleTypes] = useState<string[]>([]);
  const [remotePref, setRemotePref] = useState("open");
  const [alertFreq, setAlertFreq] = useState("weekly");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/account");
        if (!res.ok) {
          router.push("/signup");
          return;
        }
        const data: Profile = await res.json();
        setProfile(data);

        // Parse role_types JSON
        let parsed: string[] = [];
        if (data.role_types) {
          try { parsed = JSON.parse(data.role_types); } catch { parsed = []; }
        }
        setRoleTypes(parsed);
        setRemotePref(data.remote_pref || "open");
        setAlertFreq(data.alert_freq || "weekly");
      } catch {
        router.push("/signup");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_types: roleTypes,
          remote_pref: remotePref,
          alert_freq: alertFreq,
        }),
      });
      if (res.ok) {
        setSaveMessage("Preferences saved.");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch {
      setSaveMessage("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const toggleRole = (key: string) => {
    setRoleTypes((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  };

  const candidateForNav = profile
    ? { id: profile.id, name: profile.name, email: profile.email }
    : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at + "Z").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav candidate={candidateForNav} />

      <div className="max-w-container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-[600px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
            </div>
          ) : profile ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-accent-light text-accent text-base font-semibold flex items-center justify-center">
                  {profile.name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-heading text-text-primary">
                    Your Profile
                  </h1>
                  <p className="text-sm text-text-secondary">
                    {profile.name && (
                      <span className="font-medium">{profile.name} · </span>
                    )}
                    {profile.email}
                    {memberSince && (
                      <span className="text-text-tertiary">
                        {" "}· Member since {memberSince}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Preferences */}
              <section className="bg-bg-elevated border border-border rounded-md p-5 mb-6">
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Preferences
                </h2>

                {/* Role types */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Role types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => toggleRole(opt.key)}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors duration-150 ${
                          roleTypes.includes(opt.key)
                            ? "bg-accent text-white border-accent"
                            : "bg-bg-primary text-text-secondary border-border hover:border-border-hover"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remote preference */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Remote preference
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRemotePref("remote")}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors duration-150 ${
                        remotePref === "remote"
                          ? "bg-accent text-white border-accent"
                          : "bg-bg-primary text-text-secondary border-border hover:border-border-hover"
                      }`}
                    >
                      Remote only
                    </button>
                    <button
                      onClick={() => setRemotePref("open")}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors duration-150 ${
                        remotePref === "open"
                          ? "bg-accent text-white border-accent"
                          : "bg-bg-primary text-text-secondary border-border hover:border-border-hover"
                      }`}
                    >
                      Open to office
                    </button>
                  </div>
                </div>

                {/* Alert frequency */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Alert frequency
                  </label>
                  <select
                    value={alertFreq}
                    onChange={(e) => setAlertFreq(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-md border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                {/* Save */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors duration-150 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save preferences
                  </button>
                  {saveMessage && (
                    <span className="text-sm text-success">{saveMessage}</span>
                  )}
                </div>
              </section>

              {/* Saved jobs */}
              <section className="bg-bg-elevated border border-border rounded-md p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-text-tertiary" />
                    <h2 className="text-base font-semibold text-text-primary">
                      Saved Jobs
                    </h2>
                    <span className="text-sm text-text-tertiary">
                      ({profile.savedCount})
                    </span>
                  </div>
                  <Link
                    href="/saved"
                    className="text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150"
                  >
                    View all
                  </Link>
                </div>
              </section>

              {/* Danger zone */}
              <section className="border border-red-200 rounded-md p-5">
                <h2 className="text-base font-semibold text-red-600 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger zone
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  Permanently delete your account and all saved jobs. This cannot be undone.
                </p>
                {confirmDelete ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-150 disabled:opacity-50"
                    >
                      {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Yes, delete my account
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors duration-150"
                  >
                    Delete account
                  </button>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
