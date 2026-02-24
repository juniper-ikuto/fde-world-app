"use client";

import { useState, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, X, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/db";
import { BetaBadge } from "./BetaBadge";

interface Filters {
  roleTypes: string[];
  countries: string[];
  remote: boolean;
  stages: string[];
  salaryOnly: boolean;
  sort: "posted" | "discovered";
  companies: string[];
  freshness: string[];
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1">
      <Info className="w-3 h-3 text-text-tertiary cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 px-2.5 py-1.5 rounded-md bg-text-primary text-bg-primary text-xs leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
        {text}
      </span>
    </span>
  );
}

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  totalJobs: number;
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "Australia",
  "France",
  "India",
  "Netherlands",
  "Remote",
];

const STAGES = ["Seed", "Series A", "Series B", "Series C"];

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-xs font-medium uppercase tracking-caps text-text-tertiary">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-text-tertiary transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-2 py-1 cursor-pointer group"
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-sm border transition-all duration-100 flex items-center justify-center shrink-0",
          checked
            ? "bg-accent border-accent"
            : "border-border-hover group-hover:border-text-tertiary"
        )}
      >
        {checked && (
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </div>
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-100">
        {label}
      </span>
    </label>
  );
}

export default function FilterSidebar({
  filters,
  onChange,
  totalJobs,
}: FilterSidebarProps) {
  const toggleRole = (role: string) => {
    const roles = filters.roleTypes.includes(role)
      ? filters.roleTypes.filter((r) => r !== role)
      : [...filters.roleTypes, role];
    onChange({ ...filters, roleTypes: roles });
  };

  const toggleCountry = (country: string) => {
    const countries = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    onChange({ ...filters, countries });
  };

  const toggleStage = (stage: string) => {
    const stages = filters.stages.includes(stage)
      ? filters.stages.filter((s) => s !== stage)
      : [...filters.stages, stage];
    onChange({ ...filters, stages });
  };

  // Company filter state
  const [allCompanies, setAllCompanies] = useState<
    { company: string; count: number }[]
  >([]);
  const [companySearch, setCompanySearch] = useState("");
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  useEffect(() => {
    fetch("/api/jobs/companies")
      .then((res) => res.json())
      .then((data) => setAllCompanies(data))
      .catch(() => {});
  }, []);

  const filteredCompanies = allCompanies.filter((c) =>
    c.company.toLowerCase().includes(companySearch.toLowerCase())
  );
  const visibleCompanies = showAllCompanies
    ? filteredCompanies
    : filteredCompanies.slice(0, 8);

  const toggleCompany = (company: string) => {
    const isNoneMode = filters.companies.includes("__none__");
    if (isNoneMode) {
      // In "none" mode: clicking a company switches to inclusion mode showing only that company
      // Use "__include__" prefix to signal inclusion mode to API
      onChange({ ...filters, companies: ["__include__", company] });
    } else if (filters.companies.includes("__include__")) {
      // Already in inclusion mode: toggle this company in the whitelist
      const whitelist = filters.companies.filter((c) => c !== "__include__");
      const next = whitelist.includes(company)
        ? whitelist.filter((c) => c !== company)
        : [...whitelist, company];
      onChange({ ...filters, companies: next.length > 0 ? ["__include__", ...next] : [] });
    } else {
      // Normal exclusion mode
      const excluded = filters.companies.includes(company);
      const next = excluded
        ? filters.companies.filter((c) => c !== company)
        : [...filters.companies, company];
      onChange({ ...filters, companies: next });
    }
  };

  const toggleFreshness = (value: string) => {
    const next = filters.freshness.includes(value)
      ? filters.freshness.filter((f) => f !== value)
      : [...filters.freshness, value];
    onChange({ ...filters, freshness: next });
  };

  const hasActiveFilters =
    filters.roleTypes.length > 0 ||
    filters.countries.length > 0 ||
    filters.stages.length > 0 ||
    filters.freshness.length > 0 ||
    filters.remote ||
    filters.salaryOnly ||
    filters.companies.length > 0;

  const clearFilters = () => {
    onChange({
      roleTypes: [],
      countries: [],
      remote: false,
      stages: [],
      salaryOnly: false,
      sort: "posted",
      companies: [],
      freshness: [],
    });
  };

  return (
    <aside className="w-full lg:w-[260px] lg:shrink-0">
      <div className="lg:sticky lg:top-[72px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-medium text-text-primary">
              Filters
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-text-tertiary hover:text-accent transition-colors duration-150 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Freshness */}
        <FilterSection title="Freshness">
          {[
            {
              value: "hot",
              label: "🔥 Hot",
              tooltip: "Posted within the last 48 hours with a confirmed posting date.",
            },
            {
              value: "new",
              label: "✨ New",
              tooltip: "Posted within the last 7 days with a confirmed posting date. Includes Hot roles.",
            },
            {
              value: "discovered",
              label: "🔍 Discovered",
              tooltip: "Recently found by our scraper, but no confirmed posting date yet. Could be older.",
            },
          ].map(({ value, label, tooltip }) => (
            <label
              key={value}
              className="flex items-center gap-2 py-1 cursor-pointer group"
              onClick={(e) => { e.preventDefault(); toggleFreshness(value); }}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-sm border transition-all duration-100 flex items-center justify-center shrink-0",
                  filters.freshness.includes(value)
                    ? "bg-accent border-accent"
                    : "border-border-hover group-hover:border-text-tertiary"
                )}
              >
                {filters.freshness.includes(value) && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-100 flex items-center">
                {label}
                <Tooltip text={tooltip} />
              </span>
            </label>
          ))}
        </FilterSection>

        {/* Role type */}
        <FilterSection title="Role type">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <Checkbox
              key={key}
              label={label}
              checked={filters.roleTypes.includes(key)}
              onChange={() => toggleRole(key)}
            />
          ))}
        </FilterSection>

        {/* Location */}
        <FilterSection title="Location" defaultOpen={false}>
          <Checkbox
            label="Remote only"
            checked={filters.remote}
            onChange={(checked) => onChange({ ...filters, remote: checked })}
          />
          {COUNTRIES.filter((c) => c !== "Remote").map((country) => (
            <Checkbox
              key={country}
              label={country}
              checked={filters.countries.includes(country)}
              onChange={() => toggleCountry(country)}
            />
          ))}
        </FilterSection>

        {/* Company */}
        <FilterSection title="Company" defaultOpen={false}>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-sm bg-bg-secondary border border-border rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => onChange({ ...filters, companies: [] })}
              className="text-xs text-accent hover:text-accent-hover transition-colors duration-150"
            >
              Select all
            </button>
            <span className="text-xs text-text-tertiary">·</span>
            <button
              onClick={() => onChange({ ...filters, companies: ["__none__"] })}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              Remove all
            </button>
          </div>
          <div className={cn("space-y-0.5", showAllCompanies && "max-h-[240px] overflow-y-auto")}>
            {visibleCompanies.map((c) => (
              <Checkbox
                key={c.company}
                label={`${c.company} (${c.count})`}
                checked={
                  filters.companies.includes("__none__")
                    ? false  // Remove All — none checked
                    : filters.companies.includes("__include__")
                    ? filters.companies.includes(c.company)  // Inclusion mode — only whitelisted checked
                    : !filters.companies.includes(c.company) // Exclusion mode — all checked except excluded
                }
                onChange={() => toggleCompany(c.company)}
              />
            ))}
          </div>
          {!showAllCompanies && filteredCompanies.length > 8 && (
            <button
              onClick={() => setShowAllCompanies(true)}
              className="text-xs text-accent hover:text-accent-hover mt-1.5 transition-colors duration-150"
            >
              Show all {filteredCompanies.length} companies
            </button>
          )}
        </FilterSection>

        {/* Company stage */}
        <FilterSection title={<>Company stage <BetaBadge /></>} defaultOpen={false}>
          {STAGES.map((stage) => (
            <Checkbox
              key={stage}
              label={stage}
              checked={filters.stages.includes(stage)}
              onChange={() => toggleStage(stage)}
            />
          ))}
        </FilterSection>

        {/* Sort */}
        <FilterSection title="Sort by" defaultOpen={false}>
          <label className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={filters.sort === "posted"}
              onChange={() => onChange({ ...filters, sort: "posted" })}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-text-secondary">
              Recently posted
            </span>
          </label>
          <label className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={filters.sort === "discovered"}
              onChange={() => onChange({ ...filters, sort: "discovered" })}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-text-secondary">
              Recently discovered
            </span>
          </label>
        </FilterSection>

        {/* Salary */}
        <FilterSection title={<>Salary <BetaBadge /></>} defaultOpen={false}>
          <Checkbox
            label="Show only roles with salary"
            checked={filters.salaryOnly}
            onChange={(checked) =>
              onChange({ ...filters, salaryOnly: checked })
            }
          />
        </FilterSection>
      </div>
    </aside>
  );
}

// Mobile filter trigger
export function MobileFilterButton({
  onClick,
  activeCount,
}: {
  onClick: () => void;
  activeCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm text-text-secondary hover:border-border-hover transition-colors duration-150"
    >
      <SlidersHorizontal className="w-4 h-4" />
      Filters
      {activeCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
}
