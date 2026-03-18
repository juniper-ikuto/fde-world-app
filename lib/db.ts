import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { ROLE_KEYWORDS } from "./constants";

export { ROLE_KEYWORDS } from "./constants";
export { ROLE_LABELS } from "./constants";

const DB_PATH = path.resolve(
  process.cwd(),
  process.env.DB_PATH || "../scraper/jobs.db"
);

let db: Database.Database | null = null;

export function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export { DB_PATH };

function getDb(): Database.Database {
  if (db) return db;

  // If the file doesn't exist yet (first deploy before sync), create it
  if (!fs.existsSync(DB_PATH)) {
    // Ensure parent dir exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Create candidate tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      surname TEXT,
      role_types TEXT,
      location TEXT,
      remote_pref TEXT,
      status TEXT DEFAULT 'open',
      alert_freq TEXT DEFAULT 'weekly',
      verified INTEGER DEFAULT 0,
      verification_token TEXT,
      token_expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_active_at TEXT,
      linkedin_url TEXT,
      linkedin_verified INTEGER DEFAULT 0,
      linkedin_id TEXT,
      avatar_url TEXT,
      current_role TEXT,
      current_company TEXT,
      years_experience INTEGER,
      skills TEXT,
      open_to_work TEXT DEFAULT 'active',
      work_auth TEXT,
      notice_period TEXT,
      salary_min INTEGER,
      salary_currency TEXT DEFAULT 'GBP',
      cv_filename TEXT,
      cv_path TEXT
    )
  `);

  // Migrate: add columns if they don't exist
  for (const col of [
    "ALTER TABLE candidates ADD COLUMN linkedin_url TEXT",
    "ALTER TABLE candidates ADD COLUMN cv_filename TEXT",
    "ALTER TABLE candidates ADD COLUMN cv_path TEXT",
    "ALTER TABLE candidates ADD COLUMN linkedin_verified INTEGER DEFAULT 0",
    "ALTER TABLE candidates ADD COLUMN linkedin_id TEXT",
    "ALTER TABLE candidates ADD COLUMN avatar_url TEXT",
    "ALTER TABLE candidates ADD COLUMN current_role TEXT",
    "ALTER TABLE candidates ADD COLUMN current_company TEXT",
    "ALTER TABLE candidates ADD COLUMN years_experience INTEGER",
    "ALTER TABLE candidates ADD COLUMN skills TEXT",
    "ALTER TABLE candidates ADD COLUMN open_to_work TEXT DEFAULT 'active'",
    "ALTER TABLE candidates ADD COLUMN work_auth TEXT",
    "ALTER TABLE candidates ADD COLUMN notice_period TEXT",
    "ALTER TABLE candidates ADD COLUMN salary_min INTEGER",
    "ALTER TABLE candidates ADD COLUMN salary_currency TEXT DEFAULT 'GBP'",
    "ALTER TABLE candidates ADD COLUMN surname TEXT",
  ]) {
    try { db.exec(col); } catch { /* column already exists */ }
  }

  // Migrate: add featured column to jobs table if it doesn't exist
  try {
    db.exec("ALTER TABLE jobs ADD COLUMN featured INTEGER DEFAULT 0");
  } catch { /* column already exists */ }

  // Migrate: add verified and employer_id columns to jobs table
  try {
    db.exec("ALTER TABLE jobs ADD COLUMN verified INTEGER DEFAULT 0");
  } catch { /* column already exists */ }
  try {
    db.exec("ALTER TABLE jobs ADD COLUMN employer_id INTEGER");
  } catch { /* column already exists */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      job_url TEXT NOT NULL,
      saved_at TEXT DEFAULT (datetime('now')),
      UNIQUE(candidate_id, job_url)
    )
  `);

  // Employer tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS employer_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS employer_submitted_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      job_url TEXT NOT NULL,
      job_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      scraped_title TEXT,
      scraped_company TEXT,
      scraped_location TEXT,
      scraped_description TEXT,
      submitted_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT,
      rejection_reason TEXT
    )
  `);

  // Admin auth tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Hiring signals from X
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id TEXT UNIQUE,
      author_username TEXT,
      author_name TEXT,
      author_followers INTEGER,
      text TEXT,
      created_at TEXT,
      url TEXT,
      matched_query TEXT,
      score INTEGER,
      account_type TEXT,
      company_name TEXT,
      role_extracted TEXT,
      ai_reasoning TEXT,
      is_target_stage INTEGER,
      discovered_at TEXT,
      published INTEGER DEFAULT 1
    )
  `);
  // Migration: add published column if not present (for existing DBs)
  try { db.exec(`ALTER TABLE signals ADD COLUMN published INTEGER DEFAULT 1`); } catch { /* */ }

  // ── Performance indexes ──
  // These make the correlated subquery JOIN on company_enrichment fast
  // (without them every row triggers a full table scan on company_enrichment)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ce_matched_slug
      ON company_enrichment(matched_slug);
    CREATE INDEX IF NOT EXISTS idx_ce_company_name_lower
      ON company_enrichment(lower(company_name));
    CREATE INDEX IF NOT EXISTS idx_jobs_status
      ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_ats_slug
      ON jobs(ats_slug);
    CREATE INDEX IF NOT EXISTS idx_jobs_posted_date
      ON jobs(posted_date);
    CREATE INDEX IF NOT EXISTS idx_jobs_first_seen_at
      ON jobs(first_seen_at);
    CREATE INDEX IF NOT EXISTS idx_jobs_country
      ON jobs(country);
    CREATE INDEX IF NOT EXISTS idx_jobs_company
      ON jobs(lower(company));
  `);

  return db;
}

// ROLE_KEYWORDS and ROLE_LABELS re-exported from ./constants

// ── Job queries ──

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: string | null;
  posted_date: string | null;
  scraped_at: string | null;
  description_snippet: string | null;
  is_remote: number;
  salary_range: string | null;
  status: string;
  first_seen_at: string | null;
  last_seen_at: string | null;
  country: string | null;
  // Enrichment fields (joined)
  funding_stage?: string | null;
  total_raised?: string | null;
  last_funded_date?: string | null;
  employee_count?: string | null;
  industries?: string | null;
  description?: string | null;
  domain?: string | null;
  company_url?: string | null;
  // Employer verified fields
  verified?: number;
  employer_id?: number | null;
}

interface GetJobsParams {
  roleTypes?: string[];
  location?: string;
  country?: string;
  remote?: boolean;
  stage?: string[];
  salaryOnly?: boolean;
  sort?: "posted" | "discovered";
  page?: number;
  limit?: number;
  search?: string;
  excludeCompanies?: string[];
  includeCompanies?: string[];
  freshness?: string[]; // "hot" | "new" | "discovered"
}

export async function getJobs(params: GetJobsParams = {}): Promise<{
  jobs: Job[];
  total: number;
}> {
  const database = getDb();
  const {
    roleTypes = [],
    country,
    remote,
    stage = [],
    salaryOnly = false,
    sort = "posted",
    page = 1,
    limit = 20,
    search,
    excludeCompanies = [],
    includeCompanies = [],
    freshness = [],
  } = params;

  const conditions: string[] = ["j.status = 'open'"];
  const bindParams: (string | number)[] = [];

  // Role type filtering
  if (roleTypes.length > 0) {
    const roleClauses: string[] = [];
    for (const rt of roleTypes) {
      const keywords = ROLE_KEYWORDS[rt];
      if (keywords) {
        const kwClauses = keywords.map(() => "lower(j.title) LIKE ?");
        roleClauses.push(`(${kwClauses.join(" OR ")})`);
        keywords.forEach((kw) => bindParams.push(`%${kw}%`));
      }
    }
    if (roleClauses.length > 0) {
      conditions.push(`(${roleClauses.join(" OR ")})`);
    }
  }

  // Country filter
  if (country) {
    conditions.push("j.country = ?");
    bindParams.push(country);
  }

  // Remote filter
  if (remote) {
    conditions.push("(j.is_remote = 1 OR lower(j.location) LIKE '%remote%')");
  }

  // Funding stage filter
  if (stage.length > 0) {
    const stageClauses = stage.map(() => "ce.funding_stage LIKE ?");
    conditions.push(`(${stageClauses.join(" OR ")})`);
    stage.forEach((s) => bindParams.push(`%${s}%`));
  }

  // Salary filter
  if (salaryOnly) {
    conditions.push(
      "j.salary_range IS NOT NULL AND j.salary_range != ''"
    );
  }

  // Search — title, company, description snippet (skills often appear here)
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(
      "(lower(j.title) LIKE ? OR lower(j.company) LIKE ? OR lower(COALESCE(j.description_snippet,'')) LIKE ?)"
    );
    bindParams.push(term, term, term);
  }

  // Company exclusion filter
  if (excludeCompanies.length > 0) {
    const placeholders = excludeCompanies.map(() => "?").join(", ");
    conditions.push(`j.company NOT IN (${placeholders})`);
    excludeCompanies.forEach((c) => bindParams.push(c));
  }

  // Company inclusion filter (only show these companies)
  if (includeCompanies.length > 0) {
    const placeholders = includeCompanies.map(() => "?").join(", ");
    conditions.push(`j.company IN (${placeholders})`);
    includeCompanies.forEach((c) => bindParams.push(c));
  }

  // Freshness filter (OR across selected options)
  if (freshness.length > 0) {
    const freshClauses: string[] = [];
    if (freshness.includes("hot")) {
      freshClauses.push(
        "(j.posted_date IS NOT NULL AND j.posted_date != '' AND j.posted_date >= datetime('now', '-2 days'))"
      );
    }
    if (freshness.includes("new")) {
      freshClauses.push(
        "(j.posted_date IS NOT NULL AND j.posted_date != '' AND j.posted_date >= datetime('now', '-7 days'))"
      );
    }
    if (freshness.includes("discovered")) {
      freshClauses.push("(j.posted_date IS NULL OR j.posted_date = '')");
    }
    if (freshClauses.length > 0) {
      conditions.push(`(${freshClauses.join(" OR ")})`);
    }
  }

  const whereClause = conditions.join(" AND ");
  const orderBy =
    sort === "discovered"
      ? "j.first_seen_at DESC"
      : "COALESCE(j.posted_date, j.first_seen_at) DESC";

  // Count query
  const countSql = `
    SELECT COUNT(DISTINCT j.id) as cnt
    FROM jobs j
    LEFT JOIN company_enrichment ce ON ce.id = COALESCE(CASE WHEN j.ats_slug IS NOT NULL AND j.ats_slug != '' THEN (SELECT id FROM company_enrichment WHERE matched_slug = j.ats_slug LIMIT 1) END, (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1))
    WHERE ${whereClause}
  `;
  const countRow = database.prepare(countSql).get(...bindParams) as { cnt: number } | undefined;
  const total = countRow?.cnt ?? 0;

  // Data query
  const offset = (page - 1) * limit;
  const dataSql = `
    SELECT
      j.id, j.title, j.company, j.location, j.url, j.source,
      j.posted_date, j.scraped_at, j.description_snippet,
      j.is_remote, j.salary_range, j.status, j.first_seen_at,
      j.last_seen_at, j.country, j.company_url,
      j.verified, j.employer_id,
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON ce.id = COALESCE(CASE WHEN j.ats_slug IS NOT NULL AND j.ats_slug != '' THEN (SELECT id FROM company_enrichment WHERE matched_slug = j.ats_slug LIMIT 1) END, (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1))
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const jobs = database.prepare(dataSql).all(...bindParams, limit, offset) as Job[];

  return { jobs, total };
}

export async function getJobByUrl(url: string): Promise<Job | null> {
  const database = getDb();
  const row = database.prepare(
    `
    SELECT
      j.*, ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description as description, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON ce.id = COALESCE(CASE WHEN j.ats_slug IS NOT NULL AND j.ats_slug != '' THEN (SELECT id FROM company_enrichment WHERE matched_slug = j.ats_slug LIMIT 1) END, (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1))
    WHERE j.url = ?
  `
  ).get(url) as Job | undefined;

  return row ?? null;
}

// ── Stats queries ──

export async function getJobStats(): Promise<{
  openJobs: number;
  companies: number;
  sources: number;
}> {
  const database = getDb();

  const jobCount = database.prepare(
    "SELECT COUNT(*) as cnt FROM jobs WHERE status='open'"
  ).get() as { cnt: number };
  const companyCount = database.prepare(
    "SELECT COUNT(DISTINCT company) as cnt FROM jobs WHERE status='open'"
  ).get() as { cnt: number };
  const sourceCount = database.prepare(
    "SELECT COUNT(DISTINCT source) as cnt FROM jobs WHERE status='open'"
  ).get() as { cnt: number };

  return {
    openJobs: jobCount.cnt,
    companies: companyCount.cnt,
    sources: sourceCount.cnt,
  };
}

export async function getJobCountsByRole(): Promise<
  Record<string, number>
> {
  const database = getDb();
  const counts: Record<string, number> = {};

  for (const [roleKey, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const kwClauses = keywords.map(() => "lower(title) LIKE ?").join(" OR ");
    const kwParams = keywords.map((kw) => `%${kw}%`);
    const row = database.prepare(
      `SELECT COUNT(*) as cnt FROM jobs WHERE status='open' AND (${kwClauses})`
    ).get(...kwParams) as { cnt: number };
    counts[roleKey] = row.cnt;
  }

  return counts;
}

// ── Homepage queries ──

export async function getRecentJobs(limit: number = 6): Promise<Job[]> {
  const database = getDb();
  return database.prepare(
    `
    SELECT
      j.id, j.title, j.company, j.location, j.url, j.source,
      j.posted_date, j.scraped_at, j.description_snippet,
      j.is_remote, j.salary_range, j.status, j.first_seen_at,
      j.last_seen_at, j.country, j.company_url,
      j.verified, j.employer_id,
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON ce.id = COALESCE(CASE WHEN j.ats_slug IS NOT NULL AND j.ats_slug != '' THEN (SELECT id FROM company_enrichment WHERE matched_slug = j.ats_slug LIMIT 1) END, (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1))
    WHERE j.status = 'open'
    ORDER BY COALESCE(j.posted_date, j.first_seen_at) DESC
    LIMIT ?
  `
  ).all(limit) as Job[];
}

// To feature a role, run:
// UPDATE jobs SET featured=1 WHERE url='...';
// (Admin UI for this coming in Phase 2)
export async function getFeaturedJobs(): Promise<Job[]> {
  const database = getDb();
  return database.prepare(
    `
    SELECT
      j.id, j.title, j.company, j.location, j.url, j.source,
      j.posted_date, j.scraped_at, j.description_snippet,
      j.is_remote, j.salary_range, j.status, j.first_seen_at,
      j.last_seen_at, j.country, j.company_url,
      j.verified, j.employer_id,
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON ce.id = COALESCE(CASE WHEN j.ats_slug IS NOT NULL AND j.ats_slug != '' THEN (SELECT id FROM company_enrichment WHERE matched_slug = j.ats_slug LIMIT 1) END, (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1))
    WHERE j.featured = 1 AND j.status = 'open'
    ORDER BY COALESCE(j.posted_date, j.first_seen_at) DESC
    LIMIT 4
  `
  ).all() as Job[];
}

// ── Company list query ──

export async function getCompanies(): Promise<
  { company: string; count: number }[]
> {
  const database = getDb();
  return database.prepare(
    "SELECT company, COUNT(*) as count FROM jobs WHERE status='open' GROUP BY company ORDER BY count DESC"
  ).all() as { company: string; count: number }[];
}

// ── Candidate queries ──

export interface Candidate {
  id: number;
  email: string;
  name: string | null;
  surname?: string | null;
  role_types: string | null;
  location: string | null;
  remote_pref: string | null;
  status: string;
  alert_freq: string;
  verified: number;
  verification_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  last_active_at: string | null;
  linkedin_url: string | null;
  linkedin_verified: number;
  linkedin_id: string | null;
  avatar_url: string | null;
  current_role: string | null;
  current_company: string | null;
  years_experience: number | null;
  skills: string | null;
  open_to_work: string | null;
  work_auth: string | null;
  notice_period: string | null;
  salary_min: number | null;
  salary_currency: string | null;
  cv_filename: string | null;
  cv_path: string | null;
}

export async function upsertCandidate(
  email: string,
  name: string,
  roleTypes: string[],
  linkedinUrl?: string,
  cvFilename?: string,
  cvPath?: string,
  location?: string,
  surname?: string
): Promise<Candidate & { isNew: boolean }> {
  const database = getDb();
  const roleTypesJson = JSON.stringify(roleTypes);

  // Try update first
  const existing = database.prepare(
    "SELECT id FROM candidates WHERE email = ?"
  ).get(email);

  const isNew = !existing;

  if (!isNew) {
    database.prepare(
      "UPDATE candidates SET name = ?, surname = ?, role_types = ?, linkedin_url = COALESCE(?, linkedin_url), cv_filename = COALESCE(?, cv_filename), cv_path = COALESCE(?, cv_path), location = COALESCE(?, location), last_active_at = datetime('now') WHERE email = ?"
    ).run(name, surname || null, roleTypesJson, linkedinUrl || null, cvFilename || null, cvPath || null, location || null, email);
  } else {
    database.prepare(
      "INSERT INTO candidates (email, name, surname, role_types, linkedin_url, cv_filename, cv_path, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(email, name, surname || null, roleTypesJson, linkedinUrl || null, cvFilename || null, cvPath || null, location || null);
  }

  const candidate = await getCandidateByEmail(email) as Candidate;
  return { ...candidate, isNew };
}

export async function getCandidateByEmail(
  email: string
): Promise<Candidate | null> {
  const database = getDb();
  const row = database.prepare("SELECT * FROM candidates WHERE email = ?").get(email) as Candidate | undefined;
  return row ?? null;
}

export async function getCandidateById(
  id: number
): Promise<Candidate | null> {
  const database = getDb();
  const row = database.prepare("SELECT * FROM candidates WHERE id = ?").get(id) as Candidate | undefined;
  return row ?? null;
}

export async function setVerificationToken(
  candidateId: number,
  token: string,
  expiresAt: string
): Promise<void> {
  const database = getDb();
  database.prepare(
    "UPDATE candidates SET verification_token = ?, token_expires_at = ? WHERE id = ?"
  ).run(token, expiresAt, candidateId);
}

export async function verifyCandidate(token: string): Promise<Candidate | null> {
  const database = getDb();
  const row = database.prepare(
    "SELECT * FROM candidates WHERE verification_token = ? AND token_expires_at > datetime('now')"
  ).get(token) as Candidate | undefined;

  if (!row) return null;

  // Mark as verified and clear token
  database.prepare(
    "UPDATE candidates SET verified = 1, verification_token = NULL, token_expires_at = NULL, last_active_at = datetime('now') WHERE id = ?"
  ).run(row.id);

  return { ...row, verified: 1 };
}

export async function updateCandidate(
  id: number,
  fields: {
    name?: string;
    surname?: string;
    role_types?: string;
    remote_pref?: string;
    alert_freq?: string;
    current_role?: string;
    current_company?: string;
    years_experience?: number;
    skills?: string;
    open_to_work?: string;
    location?: string;
    work_auth?: string;
    notice_period?: string;
    salary_min?: number;
    salary_currency?: string;
    linkedin_url?: string;
    linkedin_verified?: number;
    linkedin_id?: string;
    avatar_url?: string;
    cv_filename?: string;
    cv_path?: string;
  }
): Promise<void> {
  const database = getDb();
  const sets: string[] = [];
  const params: (string | number)[] = [];

  const stringFields = [
    "name", "surname", "role_types", "remote_pref", "alert_freq",
    "current_role", "current_company", "skills", "open_to_work",
    "location", "work_auth", "notice_period", "salary_currency",
    "linkedin_url", "linkedin_id", "avatar_url",
    "cv_filename", "cv_path",
  ] as const;

  for (const key of stringFields) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key] as string);
    }
  }

  const numericFields = ["years_experience", "salary_min", "linkedin_verified"] as const;
  for (const key of numericFields) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key] as number);
    }
  }

  if (sets.length === 0) return;

  sets.push("last_active_at = datetime('now')");
  params.push(id);
  database.prepare(`UPDATE candidates SET ${sets.join(", ")} WHERE id = ?`).run(...params);
}

export async function deleteCandidate(id: number): Promise<void> {
  const database = getDb();
  database.prepare("DELETE FROM candidate_saved_jobs WHERE candidate_id = ?").run(id);
  database.prepare("DELETE FROM candidates WHERE id = ?").run(id);
}

export async function getSavedJobCount(candidateId: number): Promise<number> {
  const database = getDb();
  const row = database.prepare(
    "SELECT COUNT(*) as cnt FROM candidate_saved_jobs WHERE candidate_id = ?"
  ).get(candidateId) as { cnt: number };
  return row.cnt;
}

// ── Saved jobs ──

export async function getSavedJobUrls(
  candidateId: number
): Promise<string[]> {
  const database = getDb();
  const rows = database.prepare(
    "SELECT job_url FROM candidate_saved_jobs WHERE candidate_id = ? ORDER BY saved_at DESC"
  ).all(candidateId) as { job_url: string }[];
  return rows.map((r) => r.job_url);
}

export async function saveJob(
  candidateId: number,
  jobUrl: string
): Promise<void> {
  const database = getDb();
  database.prepare(
    "INSERT OR IGNORE INTO candidate_saved_jobs (candidate_id, job_url) VALUES (?, ?)"
  ).run(candidateId, jobUrl);
}

export async function unsaveJob(
  candidateId: number,
  jobUrl: string
): Promise<void> {
  const database = getDb();
  database.prepare(
    "DELETE FROM candidate_saved_jobs WHERE candidate_id = ? AND job_url = ?"
  ).run(candidateId, jobUrl);
}

export async function getSavedJobs(candidateId: number): Promise<Job[]> {
  const database = getDb();
  return database.prepare(
    `
    SELECT
      j.id, j.title, j.company, j.location, j.url, j.source,
      j.posted_date, j.scraped_at, j.description_snippet,
      j.is_remote, j.salary_range, j.status, j.first_seen_at,
      j.last_seen_at, j.country, j.company_url,
      j.verified, j.employer_id,
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM candidate_saved_jobs csj
    JOIN jobs j ON j.url = csj.job_url
    LEFT JOIN company_enrichment ce ON ce.id = COALESCE(CASE WHEN j.ats_slug IS NOT NULL AND j.ats_slug != '' THEN (SELECT id FROM company_enrichment WHERE matched_slug = j.ats_slug LIMIT 1) END, (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1))
    WHERE csj.candidate_id = ?
    ORDER BY csj.saved_at DESC
  `
  ).all(candidateId) as Job[];
}

// ── Employer queries ──

export interface Employer {
  id: number;
  name: string;
  email: string;
  company_name: string;
  created_at: string;
}

export interface EmployerSubmission {
  id: number;
  employer_id: number;
  job_url: string;
  job_id: number | null;
  status: string;
  scraped_title: string | null;
  scraped_company: string | null;
  scraped_location: string | null;
  scraped_description: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  verified?: number;
  employer_name?: string;
  employer_company?: string;
}

export async function createEmployer(
  name: string,
  email: string,
  company_name: string
): Promise<number> {
  const database = getDb();
  const result = database.prepare(
    "INSERT INTO employers (name, email, company_name) VALUES (?, ?, ?)"
  ).run(name, email.toLowerCase().trim(), company_name);
  return Number(result.lastInsertRowid);
}

export async function getEmployerByEmail(email: string): Promise<Employer | null> {
  const database = getDb();
  const row = database.prepare("SELECT * FROM employers WHERE email = ?").get(email.toLowerCase().trim()) as Employer | undefined;
  return row ?? null;
}

export async function getEmployerById(id: number): Promise<Employer | null> {
  const database = getDb();
  const row = database.prepare("SELECT * FROM employers WHERE id = ?").get(id) as Employer | undefined;
  return row ?? null;
}

export async function createEmployerSession(
  employer_id: number,
  token: string,
  expires_at: string
): Promise<void> {
  const database = getDb();
  database.prepare(
    "INSERT INTO employer_sessions (employer_id, token, expires_at) VALUES (?, ?, ?)"
  ).run(employer_id, token, expires_at);
}

export async function getEmployerBySessionToken(token: string): Promise<Employer | null> {
  const database = getDb();
  const row = database.prepare(
    `SELECT e.* FROM employers e
     JOIN employer_sessions es ON es.employer_id = e.id
     WHERE es.token = ? AND es.expires_at > datetime('now')`
  ).get(token) as Employer | undefined;
  return row ?? null;
}

export async function deleteEmployerSession(token: string): Promise<void> {
  const database = getDb();
  database.prepare("DELETE FROM employer_sessions WHERE token = ?").run(token);
}

export async function createEmployerSubmission(
  employer_id: number,
  job_url: string,
  scraped_title: string | null,
  scraped_company: string | null,
  scraped_location: string | null,
  scraped_description: string | null,
  job_id?: number | null
): Promise<number> {
  const database = getDb();
  const result = database.prepare(
    `INSERT INTO employer_submitted_jobs (employer_id, job_url, job_id, scraped_title, scraped_company, scraped_location, scraped_description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(employer_id, job_url, job_id ?? null, scraped_title, scraped_company, scraped_location, scraped_description);
  return Number(result.lastInsertRowid);
}

export async function getEmployerSubmissions(employer_id: number): Promise<EmployerSubmission[]> {
  const database = getDb();
  return database.prepare(
    `SELECT esj.*, COALESCE(j.verified, 0) as verified
     FROM employer_submitted_jobs esj
     LEFT JOIN jobs j ON esj.job_id = j.id
     WHERE esj.employer_id = ?
     ORDER BY esj.submitted_at DESC`
  ).all(employer_id) as EmployerSubmission[];
}

export async function getEmployerSubmissionById(id: number): Promise<EmployerSubmission | null> {
  const database = getDb();
  const row = database.prepare("SELECT * FROM employer_submitted_jobs WHERE id = ?").get(id) as EmployerSubmission | undefined;
  return row ?? null;
}

export async function getAllPendingSubmissions(): Promise<EmployerSubmission[]> {
  const database = getDb();
  return database.prepare(
    `SELECT esj.*, e.name as employer_name, e.company_name as employer_company
     FROM employer_submitted_jobs esj
     JOIN employers e ON esj.employer_id = e.id
     ORDER BY
       CASE WHEN esj.status = 'pending' THEN 0 ELSE 1 END ASC,
       CASE WHEN esj.status = 'pending' THEN esj.submitted_at ELSE esj.reviewed_at END DESC
     LIMIT 100`
  ).all() as EmployerSubmission[];
}

export async function updateSubmissionJobId(submissionId: number, jobId: number): Promise<void> {
  const database = getDb();
  database.prepare("UPDATE employer_submitted_jobs SET job_id = ? WHERE id = ?").run(jobId, submissionId);
}

export async function approveSubmission(id: number): Promise<void> {
  const database = getDb();
  database.prepare(
    "UPDATE employer_submitted_jobs SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?"
  ).run(id);
  // If job_id exists, set verified and employer_id on the job
  const sub = database.prepare("SELECT job_id, employer_id FROM employer_submitted_jobs WHERE id = ?").get(id) as { job_id: number | null; employer_id: number } | undefined;
  if (sub?.job_id) {
    database.prepare("UPDATE jobs SET verified = 1, employer_id = ? WHERE id = ?").run(sub.employer_id, sub.job_id);
  }
}

export async function rejectSubmission(id: number, reason?: string): Promise<void> {
  const database = getDb();
  database.prepare(
    "UPDATE employer_submitted_jobs SET status = 'rejected', reviewed_at = datetime('now'), rejection_reason = ? WHERE id = ?"
  ).run(reason || null, id);
}

export async function getOrCreateJobFromUrl(
  url: string,
  scraped_title: string | null,
  scraped_company: string | null,
  scraped_location: string | null,
  scraped_description: string | null
): Promise<{ job_id: number; was_duplicate: boolean }> {
  const database = getDb();

  // Check if job URL already exists
  const existing = database.prepare("SELECT id FROM jobs WHERE url = ?").get(url) as { id: number } | undefined;
  if (existing) {
    return { job_id: existing.id, was_duplicate: true };
  }

  // Create new job with status='open'
  const result = database.prepare(
    `INSERT INTO jobs (title, company, location, url, status, description_snippet, first_seen_at)
     VALUES (?, ?, ?, ?, 'open', ?, datetime('now'))`
  ).run(
    scraped_title || "Untitled Role",
    scraped_company || "Unknown Company",
    scraped_location || null,
    url,
    scraped_description ? scraped_description.slice(0, 500) : null,
  );
  return { job_id: Number(result.lastInsertRowid), was_duplicate: false };
}

// ── Admin job management ──

export async function adminSearchJobs(params: {
  search?: string;
  status?: string;
  source?: string;
  page: number;
  limit: number;
}): Promise<{ jobs: Record<string, unknown>[]; total: number }> {
  const database = getDb();
  const conditions: string[] = [];
  const bindParams: (string | number)[] = [];

  if (params.search) {
    const term = `%${params.search.toLowerCase()}%`;
    conditions.push("(lower(title) LIKE ? OR lower(company) LIKE ?)");
    bindParams.push(term, term);
  }

  if (params.status && params.status !== "all") {
    conditions.push("status = ?");
    bindParams.push(params.status);
  }

  if (params.source && params.source !== "all") {
    conditions.push("source = ?");
    bindParams.push(params.source);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = database.prepare(
    `SELECT COUNT(*) as cnt FROM jobs ${whereClause}`
  ).get(...bindParams) as { cnt: number };
  const total = countRow.cnt;

  const offset = (params.page - 1) * params.limit;
  const jobs = database.prepare(
    `SELECT id, title, company, location, url AS job_url, source, status, posted_date, first_seen_at,
            salary_range, country
     FROM jobs ${whereClause}
     ORDER BY first_seen_at DESC
     LIMIT ? OFFSET ?`
  ).all(...bindParams, params.limit, offset) as Record<string, unknown>[];

  return { jobs, total };
}

export async function updateJob(
  id: number,
  fields: Partial<{
    title: string;
    company: string;
    location: string;
    salary_range: string | null;
    job_url: string;
    status: string;
    posted_date: string | null;
  }>
): Promise<void> {
  const database = getDb();
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      const col = key === "job_url" ? "url" : key;
      sets.push(`${col} = ?`);
      params.push(value);
    }
  }

  if (sets.length === 0) return;

  params.push(id);
  database.prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`).run(...params);
}

export async function deleteJob(id: number, hard?: boolean): Promise<void> {
  const database = getDb();
  if (hard) {
    database.prepare("DELETE FROM jobs WHERE id = ?").run(id);
  } else {
    database.prepare("UPDATE jobs SET status = ? WHERE id = ?").run("closed", id);
  }
}

// ── Admin candidate search ──

export async function adminSearchCandidates(params: {
  search?: string;
  has_cv?: boolean;
  has_linkedin?: boolean;
  open_to_work?: boolean;
  page: number;
  limit: number;
}): Promise<{ candidates: Record<string, unknown>[]; total: number }> {
  const database = getDb();
  const conditions: string[] = [];
  const bindParams: (string | number)[] = [];

  if (params.search) {
    const term = `%${params.search.toLowerCase()}%`;
    conditions.push("(lower(name) LIKE ? OR lower(surname) LIKE ? OR lower(email) LIKE ?)");
    bindParams.push(term, term, term);
  }

  if (params.has_cv) {
    conditions.push("cv_path IS NOT NULL AND cv_path != ''");
  }

  if (params.has_linkedin) {
    conditions.push("linkedin_url IS NOT NULL AND linkedin_url != ''");
  }

  if (params.open_to_work) {
    conditions.push("open_to_work = 'active'");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = database.prepare(
    `SELECT COUNT(*) as cnt FROM candidates ${whereClause}`
  ).get(...bindParams) as { cnt: number };
  const total = countRow.cnt;

  const offset = (params.page - 1) * params.limit;
  const candidates = database.prepare(
    `SELECT * FROM candidates ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...bindParams, params.limit, offset) as Record<string, unknown>[];

  return { candidates, total };
}

// ── Admin token queries ──

export async function createAdminTokenRecord(
  tokenHash: string,
  email: string,
  expiresAt: string
): Promise<void> {
  const database = getDb();
  database.prepare(
    "INSERT INTO admin_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)"
  ).run(tokenHash, email, expiresAt);
}

export async function consumeAdminToken(
  tokenHash: string
): Promise<{ email: string } | null> {
  const database = getDb();
  const row = database.prepare(
    "SELECT email FROM admin_tokens WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')"
  ).get(tokenHash) as { email: string } | undefined;

  if (!row) return null;

  database.prepare(
    "UPDATE admin_tokens SET used = 1 WHERE token_hash = ?"
  ).run(tokenHash);

  return { email: row.email };
}

// ── Signal queries ──

export interface Signal {
  id: number;
  tweet_id: string;
  author_username: string;
  author_name: string;
  author_followers: number;
  text: string;
  created_at: string;
  url: string;
  matched_query: string;
  score: number;
  account_type: string;
  company_name: string | null;
  role_extracted: string | null;
  ai_reasoning: string | null;
  is_target_stage: number;
  discovered_at: string;
  published: number;
}

export async function upsertSignals(
  signals: Partial<Signal>[]
): Promise<{ inserted: number; updated: number }> {
  const database = getDb();
  let inserted = 0;
  let updated = 0;

  const insertStmt = database.prepare(
    `INSERT INTO signals (
      tweet_id, author_username, author_name, author_followers,
      text, created_at, url, matched_query, score, account_type,
      company_name, role_extracted, ai_reasoning, is_target_stage, discovered_at, published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const updateStmt = database.prepare(
    `UPDATE signals SET
      author_username = ?, author_name = ?, author_followers = ?,
      text = ?, created_at = ?, url = ?, matched_query = ?,
      score = ?, account_type = ?, company_name = ?,
      role_extracted = ?, ai_reasoning = ?, is_target_stage = ?,
      discovered_at = ?, published = ?
    WHERE tweet_id = ?`
  );

  const checkStmt = database.prepare("SELECT id FROM signals WHERE tweet_id = ?");

  const upsertAll = database.transaction((items: Partial<Signal>[]) => {
    for (const s of items) {
      const existing = checkStmt.get(s.tweet_id ?? null);

      if (existing) {
        updateStmt.run(
          s.author_username ?? null, s.author_name ?? null, s.author_followers ?? null,
          s.text ?? null, s.created_at ?? null, s.url ?? null, s.matched_query ?? null,
          s.score ?? null, s.account_type ?? null, s.company_name ?? null,
          s.role_extracted ?? null, s.ai_reasoning ?? null, s.is_target_stage ?? null,
          s.discovered_at ?? null, s.published ?? 1, s.tweet_id ?? null,
        );
        updated++;
      } else {
        insertStmt.run(
          s.tweet_id ?? null, s.author_username ?? null, s.author_name ?? null,
          s.author_followers ?? null, s.text ?? null, s.created_at ?? null,
          s.url ?? null, s.matched_query ?? null, s.score ?? null,
          s.account_type ?? null, s.company_name ?? null, s.role_extracted ?? null,
          s.ai_reasoning ?? null, s.is_target_stage ?? null, s.discovered_at ?? null,
          s.published ?? 1,
        );
        inserted++;
      }
    }
  });

  upsertAll(signals);
  return { inserted, updated };
}

export async function getSignalsFeed(limit: number = 20): Promise<Signal[]> {
  const database = getDb();
  return database.prepare(
    `SELECT * FROM signals
     WHERE published = 1
     ORDER BY score DESC, discovered_at DESC
     LIMIT ?`
  ).all(limit) as Signal[];
}

export interface CompanyInsight {
  found: true;
  company_name: string;
  funding_stage: string | null;
  yc_batch: string | null;
  total_raised: string | null;
  last_raised: string | null;
  last_funded_date: string | null;
  industries: string | null;
  hq_location: string | null;
  investors: string | null;
  description: string | null;
}

export async function getCompanyInsights(
  name: string,
  linkedinSlug?: string
): Promise<CompanyInsight | null> {
  const database = getDb();

  // Strategy 0: LinkedIn company slug match (most reliable — from /company/slug/ URL)
  if (linkedinSlug && linkedinSlug.length >= 2) {
    const slugNorm = linkedinSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
    const row = database.prepare(
      `SELECT company_name, funding_stage, yc_batch, total_raised, last_raised, last_funded_date,
              industries, hq_location, investors, description
       FROM company_enrichment
       WHERE REPLACE(REPLACE(LOWER(COALESCE(matched_slug, domain, '')), '-', ''), '.', '') = ?
          OR REPLACE(REPLACE(LOWER(COALESCE(domain, '')), '-', ''), '.', '') LIKE ?
       LIMIT 1`
    ).get(slugNorm, `${slugNorm}%`) as Record<string, unknown> | undefined;
    if (row) {
      return {
        found: true,
        company_name: row.company_name as string,
        funding_stage: (row.funding_stage as string) || null,
        yc_batch: (row.yc_batch as string) || null,
        total_raised: (row.total_raised as string) || null,
        last_raised: (row.last_raised as string) || null,
        last_funded_date: (row.last_funded_date as string) || null,
        industries: (row.industries as string) || null,
        hq_location: (row.hq_location as string) || null,
        investors: (row.investors as string) || null,
        description: (row.description as string) || null,
      };
    }
  }

  if (!name) return null;

  // Strategy 1: Exact match (case insensitive)
  let row = database.prepare(
    `SELECT company_name, funding_stage, total_raised, last_raised, last_funded_date,
            industries, hq_location, investors, description
     FROM company_enrichment
     WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?))
     LIMIT 1`
  ).get(name) as Record<string, unknown> | undefined;

  // Strategy 2: Suffix-stripped exact match ("Anthropic, Inc." → "Anthropic")
  if (!row) {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(
          /\b(inc|ltd|llc|llp|corp|corporation|limited|co|company|group|holdings|technologies|technology|solutions|services|labs|lab|ai|hq)\b/g,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();

    const normalizedName = normalize(name);
    if (normalizedName) {
      row = database.prepare(
        `SELECT company_name, funding_stage, total_raised, last_raised, last_funded_date,
                industries, hq_location, investors, description
         FROM company_enrichment
         WHERE TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                 LOWER(company_name),
                 ',', ' '), '.', ' '), '''', ''), '!', ''), '&', ' '), '-', ' '), '(', ''), ')', ''),
                 'inc', ''), 'ltd', ''))
               = ?
         LIMIT 1`
      ).get(normalizedName) as Record<string, unknown> | undefined;
    }
  }

  if (!row) return null;

  return {
    found: true,
    company_name: row.company_name as string,
    funding_stage: (row.funding_stage as string) || null,
    yc_batch: (row.yc_batch as string) || null,
    total_raised: (row.total_raised as string) || null,
    last_raised: (row.last_raised as string) || null,
    last_funded_date: (row.last_funded_date as string) || null,
    industries: (row.industries as string) || null,
    hq_location: (row.hq_location as string) || null,
    investors: (row.investors as string) || null,
    description: (row.description as string) || null,
  };
}
