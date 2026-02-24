"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  X,
} from "lucide-react";
import Nav from "@/components/Nav";
import Link from "next/link";
import Image from "next/image";

const ROLE_OPTIONS = [
  { key: "fde", label: "Forward Deployed Engineer" },
  { key: "se", label: "Solutions Engineer" },
  { key: "tam", label: "Technical Account Manager" },
  { key: "presales", label: "Pre-Sales / Sales Engineer" },
  { key: "impl", label: "Implementation Engineer" },
];

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "0", label: "Less than 1 year" },
  { value: "1", label: "1–2 years" },
  { value: "3", label: "3–5 years" },
  { value: "5", label: "5–10 years" },
  { value: "10", label: "10+ years" },
];

const NOTICE_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "Immediate", label: "Immediate" },
  { value: "2 weeks", label: "2 weeks" },
  { value: "1 month", label: "1 month" },
  { value: "2 months", label: "2 months" },
  { value: "3 months+", label: "3 months+" },
];

const WORK_AUTH_OPTIONS = ["UK", "US", "EU", "Canada", "Australia", "Remote only"];

interface Profile {
  id: number;
  email: string;
  name: string | null;
  role_types: string | null;
  remote_pref: string | null;
  alert_freq: string | null;
  created_at: string | null;
  linkedin_url: string | null;
  linkedin_verified: number;
  avatar_url: string | null;
  current_role: string | null;
  current_company: string | null;
  years_experience: number | null;
  skills: string | null;
  open_to_work: string | null;
  location: string | null;
  work_auth: string | null;
  notice_period: string | null;
  salary_min: number | null;
  salary_currency: string | null;
  cv_filename: string | null;
  cv_path: string | null;
  savedCount: number;
}

function calcCompleteness(p: Profile): number {
  let score = 0;
  if (p.name) score += 10;
  if (p.linkedin_url) score += 15;
  if (p.current_role) score += 10;
  if (p.current_company) score += 10;
  if (p.years_experience != null) score += 10;
  if (p.skills) {
    try { if (JSON.parse(p.skills).length > 0) score += 10; } catch {}
  }
  if (p.location) score += 10;
  if (p.open_to_work) score += 5;
  if (p.notice_period) score += 5;
  if (p.salary_min != null) score += 5;
  return score;
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
  const [name, setName] = useState("");
  const [roleTypes, setRoleTypes] = useState<string[]>([]);
  const [remotePref, setRemotePref] = useState("open");
  const [alertFreq, setAlertFreq] = useState("weekly");
  const [currentRole, setCurrentRole] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [openToWork, setOpenToWork] = useState("active");
  const [location, setLocation] = useState("");
  const [workAuth, setWorkAuth] = useState<string[]>([]);
  const [noticePeriod, setNoticePeriod] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("GBP");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // CV state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Populate form state
        setName(data.name || "");
        let parsed: string[] = [];
        if (data.role_types) {
          try { parsed = JSON.parse(data.role_types); } catch { parsed = []; }
        }
        setRoleTypes(parsed);
        setRemotePref(data.remote_pref || "open");
        setAlertFreq(data.alert_freq || "weekly");
        setCurrentRole(data.current_role || "");
        setCurrentCompany(data.current_company || "");
        setYearsExperience(data.years_experience != null ? String(data.years_experience) : "");
        let parsedSkills: string[] = [];
        if (data.skills) {
          try { parsedSkills = JSON.parse(data.skills); } catch { parsedSkills = []; }
        }
        setSkills(parsedSkills);
        setOpenToWork(data.open_to_work || "active");
        setLocation(data.location || "");
        let parsedWorkAuth: string[] = [];
        if (data.work_auth) {
          try { parsedWorkAuth = JSON.parse(data.work_auth); } catch { parsedWorkAuth = []; }
        }
        setWorkAuth(parsedWorkAuth);
        setNoticePeriod(data.notice_period || "");
        setSalaryMin(data.salary_min != null ? String(data.salary_min) : "");
        setSalaryCurrency(data.salary_currency || "GBP");
        setLinkedinUrl(data.linkedin_url || "");
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
          name,
          role_types: roleTypes,
          remote_pref: remotePref,
          alert_freq: alertFreq,
          current_role: currentRole,
          current_company: currentCompany,
          years_experience: yearsExperience ? Number(yearsExperience) : undefined,
          skills,
          open_to_work: openToWork,
          location,
          work_auth: workAuth,
          notice_period: noticePeriod,
          salary_min: salaryMin ? Number(salaryMin) : undefined,
          salary_currency: salaryCurrency,
          linkedin_url: linkedinUrl,
        }),
      });
      if (res.ok) {
        setSaveMessage("Profile saved.");
        // Update profile state for completeness bar
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name,
                current_role: currentRole || null,
                current_company: currentCompany || null,
                years_experience: yearsExperience ? Number(yearsExperience) : null,
                skills: skills.length > 0 ? JSON.stringify(skills) : null,
                open_to_work: openToWork,
                location: location || null,
                work_auth: workAuth.length > 0 ? JSON.stringify(workAuth) : null,
                notice_period: noticePeriod || null,
                salary_min: salaryMin ? Number(salaryMin) : null,
                salary_currency: salaryCurrency,
                linkedin_url: linkedinUrl || null,
              }
            : prev
        );
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch {
      setSaveMessage("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCvUpload = async () => {
    if (!cvFile) return;
    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", cvFile);
      const res = await fetch("/api/account/cv", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) =>
          prev ? { ...prev, cv_filename: data.cv_filename, cv_path: data.cv_path } : prev
        );
        setCvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      // silent fail
    } finally {
      setCvUploading(false);
    }
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setDeleteError("Something went wrong. Please try again.");
        setDeleting(false);
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const toggleRole = (key: string) => {
    setRoleTypes((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  };

  const toggleWorkAuth = (val: string) => {
    setWorkAuth((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const addSkill = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at + "Z").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const completeness = profile ? calcCompleteness(profile) : 0;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="max-w-container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-[600px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
            </div>
          ) : profile ? (
            <>
              {/* Profile header */}
              <div className="flex items-center gap-3 mb-4">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent-light text-accent text-base font-semibold flex items-center justify-center">
                    {profile.name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold tracking-heading text-text-primary">
                    Your Profile
                  </h1>
                  <p className="text-sm text-text-secondary truncate">
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

              {/* Completeness bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text-secondary">
                    Your profile is {completeness}% complete
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {/* Details form */}
              <section className="bg-bg-elevated border border-border rounded-md p-5 mb-6">
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Profile Details
                </h2>

                {/* Name */}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Current role */}
                <div className="mb-4">
                  <label htmlFor="currentRole" className="block text-sm font-medium text-text-primary mb-1.5">
                    Current role
                  </label>
                  <input
                    id="currentRole"
                    type="text"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    placeholder="e.g. Solutions Engineer"
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Current company */}
                <div className="mb-4">
                  <label htmlFor="currentCompany" className="block text-sm font-medium text-text-primary mb-1.5">
                    Current company
                  </label>
                  <input
                    id="currentCompany"
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Salesforce"
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Years of experience */}
                <div className="mb-4">
                  <label htmlFor="yearsExp" className="block text-sm font-medium text-text-primary mb-1.5">
                    Years of SE/FDE experience
                  </label>
                  <select
                    id="yearsExp"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-accent-light text-accent rounded-md"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-accent-hover"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }}
                    placeholder="Type a skill and press Enter"
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label htmlFor="location" className="block text-sm font-medium text-text-primary mb-1.5">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Work authorisation */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Work authorisation
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WORK_AUTH_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleWorkAuth(opt)}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors duration-150 ${
                          workAuth.includes(opt)
                            ? "bg-accent text-white border-accent"
                            : "bg-bg-primary text-text-secondary border-border hover:border-border-hover"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Open to work */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Open to work
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "active", label: "Actively looking" },
                      { value: "passive", label: "Open to opportunities" },
                      { value: "closed", label: "Not looking" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="openToWork"
                          value={opt.value}
                          checked={openToWork === opt.value}
                          onChange={(e) => setOpenToWork(e.target.value)}
                          className="accent-accent"
                        />
                        <span className="text-sm text-text-primary">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notice period */}
                <div className="mb-4">
                  <label htmlFor="noticePeriod" className="block text-sm font-medium text-text-primary mb-1.5">
                    Notice period
                  </label>
                  <select
                    id="noticePeriod"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  >
                    {NOTICE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salary expectation */}
                <div className="mb-5">
                  <label htmlFor="salaryMin" className="block text-sm font-medium text-text-primary mb-1.5">
                    Minimum salary expectation
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={salaryCurrency}
                      onChange={(e) => setSalaryCurrency(e.target.value)}
                      className="h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/20"
                    >
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <input
                      id="salaryMin"
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="e.g. 80000"
                      className="flex-1 h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20"
                    />
                  </div>
                </div>

                {/* LinkedIn URL */}
                <div className="mb-5">
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-text-primary mb-1.5">
                    LinkedIn profile URL
                  </label>
                  <input
                    id="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full h-10 px-3 text-sm bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Save */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors duration-150 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save profile
                  </button>
                  {saveMessage && (
                    <span className="text-sm text-success">{saveMessage}</span>
                  )}
                </div>
              </section>

              {/* Role preferences */}
              <section className="bg-bg-elevated border border-border rounded-md p-5 mb-6">
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Role Preferences
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
                <div>
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
              </section>

              {/* CV section */}
              <section className="bg-bg-elevated border border-border rounded-md p-5 mb-6">
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  CV / Resume
                </h2>
                {profile.cv_filename ? (
                  <div className="flex items-center gap-3 mb-3">
                    <Upload className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-sm text-text-primary truncate flex-1">
                      {profile.cv_filename}
                    </span>
                    {profile.cv_path && (
                      <a
                        href={profile.cv_path}
                        download
                        className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary mb-3">No CV uploaded yet.</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                      setCvFile(file);
                    }
                  }}
                  className="hidden"
                />
                {cvFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary truncate">{cvFile.name}</span>
                    <button
                      onClick={handleCvUpload}
                      disabled={cvUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors disabled:opacity-50"
                    >
                      {cvUploading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Upload
                    </button>
                    <button
                      onClick={() => {
                        setCvFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-sm text-text-tertiary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-bg-primary border border-border border-dashed rounded-md text-text-secondary hover:border-border-hover hover:text-text-primary transition-all duration-150"
                  >
                    <Upload className="w-4 h-4" />
                    {profile.cv_filename ? "Replace CV" : "Upload CV"}
                  </button>
                )}
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
                  This will permanently delete your account and all your data,
                  including your CV. This cannot be undone.
                </p>
                {confirmDelete ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-150 disabled:opacity-50"
                    >
                      {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Yes, delete everything
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
                    Delete my account
                  </button>
                )}
                {deleteError && (
                  <p className="text-sm text-destructive mt-3">{deleteError}</p>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
