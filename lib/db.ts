import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve(
  process.cwd(),
  process.env.DB_PATH || "../scraper/jobs.db"
);

let db: SqlJsDatabase | null = null;
let lastWriteTime = 0;

export function resetDb() {
  db = null;
}

export { DB_PATH };

async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs({
    // Load WASM from filesystem — works in both dev and production (Railway)
    locateFile: (file: string) => path.join(process.cwd(), "public", file),
  });
  // Start with empty DB if file doesn't exist yet (first deploy before sync)
  const buffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : undefined;
  db = buffer ? new SQL.Database(buffer) : new SQL.Database();

  // Create candidate tables if they don't exist
  db.run(`
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
    try { db.run(col); } catch { /* column already exists */ }
  }

  // Migrate: add featured column to jobs table if it doesn't exist
  try {
    db.run("ALTER TABLE jobs ADD COLUMN featured INTEGER DEFAULT 0");
  } catch { /* column already exists */ }

  // Migrate: add verified and employer_id columns to jobs table
  try {
    db.run("ALTER TABLE jobs ADD COLUMN verified INTEGER DEFAULT 0");
  } catch { /* column already exists */ }
  try {
    db.run("ALTER TABLE jobs ADD COLUMN employer_id INTEGER");
  } catch { /* column already exists */ }

  db.run(`
    CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      job_url TEXT NOT NULL,
      saved_at TEXT DEFAULT (datetime('now')),
      UNIQUE(candidate_id, job_url)
    )
  `);

  // Employer tables
  db.run(`
    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS employer_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
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
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const now = Date.now();
  if (now - lastWriteTime < 1000) return; // Debounce writes
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  lastWriteTime = now;
}

function forceSave() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  lastWriteTime = Date.now();
}

// ── Role keyword mapping ──

export const ROLE_KEYWORDS: Record<string, string[]> = {
  se: ["solutions engineer", "solutions consultant"],
  fde: ["forward deployed engineer", "fde"],
  presales: ["pre-sales", "presales", "sales engineer"],
  tam: [
    "technical account manager",
    "customer success engineer",
    "customer engineer",
  ],
  impl: [
    "implementation engineer",
    "deployment engineer",
    "integration engineer",
  ],
};

export const ROLE_LABELS: Record<string, string> = {
  fde: "Forward Deployed Engineer",
  se: "Solutions Engineer",
  presales: "Pre-Sales / Sales Engineer",
  tam: "Technical Account Manager",
  impl: "Implementation Engineer",
};

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
  const database = await getDb();
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
    SELECT COUNT(DISTINCT j.id)
    FROM jobs j
    LEFT JOIN company_enrichment ce ON ce.id = (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1)
    WHERE ${whereClause}
  `;
  const countResult = database.exec(countSql, bindParams);
  const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

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
    LEFT JOIN company_enrichment ce ON ce.id = (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1)
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const result = database.exec(dataSql, [...bindParams, limit, offset]);

  const jobs: Job[] = [];
  if (result.length > 0) {
    const columns = result[0].columns;
    for (const row of result[0].values) {
      const job: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        job[col] = row[i];
      });
      jobs.push(job as unknown as Job);
    }
  }

  return { jobs, total };
}

export async function getJobByUrl(url: string): Promise<Job | null> {
  const database = await getDb();
  const result = database.exec(
    `
    SELECT
      j.*, ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description as enrichment_desc, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON ce.id = (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1)
    WHERE j.url = ?
  `,
    [url]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const job: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    job[col === "enrichment_desc" ? "description" : col] = row[i];
  });
  return job as unknown as Job;
}

// ── Stats queries ──

export async function getJobStats(): Promise<{
  openJobs: number;
  companies: number;
  sources: number;
}> {
  const database = await getDb();

  const jobCount = database.exec(
    "SELECT COUNT(*) FROM jobs WHERE status='open'"
  );
  const companyCount = database.exec(
    "SELECT COUNT(DISTINCT company) FROM jobs WHERE status='open'"
  );
  const sourceCount = database.exec(
    "SELECT COUNT(DISTINCT source) FROM jobs WHERE status='open'"
  );

  return {
    openJobs: jobCount[0]?.values[0][0] as number,
    companies: companyCount[0]?.values[0][0] as number,
    sources: sourceCount[0]?.values[0][0] as number,
  };
}

export async function getJobCountsByRole(): Promise<
  Record<string, number>
> {
  const database = await getDb();
  const counts: Record<string, number> = {};

  for (const [roleKey, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const kwClauses = keywords.map(() => "lower(title) LIKE ?").join(" OR ");
    const kwParams = keywords.map((kw) => `%${kw}%`);
    const result = database.exec(
      `SELECT COUNT(*) FROM jobs WHERE status='open' AND (${kwClauses})`,
      kwParams
    );
    counts[roleKey] = result[0]?.values[0][0] as number;
  }

  return counts;
}

// ── Homepage queries ──

export async function getRecentJobs(limit: number = 6): Promise<Job[]> {
  const database = await getDb();
  const result = database.exec(
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
    LEFT JOIN company_enrichment ce ON ce.id = (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1)
    WHERE j.status = 'open'
    ORDER BY COALESCE(j.posted_date, j.first_seen_at) DESC
    LIMIT ?
  `,
    [limit]
  );

  const jobs: Job[] = [];
  if (result.length > 0) {
    const columns = result[0].columns;
    for (const row of result[0].values) {
      const job: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        job[col] = row[i];
      });
      jobs.push(job as unknown as Job);
    }
  }
  return jobs;
}

// To feature a role, run:
// UPDATE jobs SET featured=1 WHERE url='...';
// (Admin UI for this coming in Phase 2)
export async function getFeaturedJobs(): Promise<Job[]> {
  const database = await getDb();
  const result = database.exec(
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
    LEFT JOIN company_enrichment ce ON ce.id = (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1)
    WHERE j.featured = 1 AND j.status = 'open'
    ORDER BY COALESCE(j.posted_date, j.first_seen_at) DESC
    LIMIT 4
  `
  );

  const jobs: Job[] = [];
  if (result.length > 0) {
    const columns = result[0].columns;
    for (const row of result[0].values) {
      const job: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        job[col] = row[i];
      });
      jobs.push(job as unknown as Job);
    }
  }
  return jobs;
}

// ── Company list query ──

export async function getCompanies(): Promise<
  { company: string; count: number }[]
> {
  const database = await getDb();
  const result = database.exec(
    "SELECT company, COUNT(*) as count FROM jobs WHERE status='open' GROUP BY company ORDER BY count DESC"
  );

  if (result.length === 0) return [];
  return result[0].values.map((row) => ({
    company: row[0] as string,
    count: row[1] as number,
  }));
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
): Promise<Candidate> {
  const database = await getDb();
  const roleTypesJson = JSON.stringify(roleTypes);

  // Try update first
  const existing = database.exec(
    "SELECT id FROM candidates WHERE email = ?",
    [email]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    database.run(
      "UPDATE candidates SET name = ?, surname = ?, role_types = ?, linkedin_url = COALESCE(?, linkedin_url), cv_filename = COALESCE(?, cv_filename), cv_path = COALESCE(?, cv_path), location = COALESCE(?, location), last_active_at = datetime('now') WHERE email = ?",
      [name, surname || null, roleTypesJson, linkedinUrl || null, cvFilename || null, cvPath || null, location || null, email]
    );
  } else {
    database.run(
      "INSERT INTO candidates (email, name, surname, role_types, linkedin_url, cv_filename, cv_path, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [email, name, surname || null, roleTypesJson, linkedinUrl || null, cvFilename || null, cvPath || null, location || null]
    );
  }

  forceSave();
  return getCandidateByEmail(email) as Promise<Candidate>;
}

export async function getCandidateByEmail(
  email: string
): Promise<Candidate | null> {
  const database = await getDb();
  const result = database.exec("SELECT * FROM candidates WHERE email = ?", [
    email,
  ]);

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const candidate: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    candidate[col] = row[i];
  });
  return candidate as unknown as Candidate;
}

export async function getCandidateById(
  id: number
): Promise<Candidate | null> {
  const database = await getDb();
  const result = database.exec("SELECT * FROM candidates WHERE id = ?", [id]);

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const candidate: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    candidate[col] = row[i];
  });
  return candidate as unknown as Candidate;
}

export async function setVerificationToken(
  candidateId: number,
  token: string,
  expiresAt: string
): Promise<void> {
  const database = await getDb();
  database.run(
    "UPDATE candidates SET verification_token = ?, token_expires_at = ? WHERE id = ?",
    [token, expiresAt, candidateId]
  );
  forceSave();
}

export async function verifyCandidate(token: string): Promise<Candidate | null> {
  const database = await getDb();
  const result = database.exec(
    "SELECT * FROM candidates WHERE verification_token = ? AND token_expires_at > datetime('now')",
    [token]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const candidate: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    candidate[col] = row[i];
  });

  const c = candidate as unknown as Candidate;

  // Mark as verified and clear token
  database.run(
    "UPDATE candidates SET verified = 1, verification_token = NULL, token_expires_at = NULL, last_active_at = datetime('now') WHERE id = ?",
    [c.id]
  );
  forceSave();

  return { ...c, verified: 1 };
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
  const database = await getDb();
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
  database.run(`UPDATE candidates SET ${sets.join(", ")} WHERE id = ?`, params);
  forceSave();
}

export async function deleteCandidate(id: number): Promise<void> {
  const database = await getDb();
  database.run("DELETE FROM candidate_saved_jobs WHERE candidate_id = ?", [id]);
  database.run("DELETE FROM candidates WHERE id = ?", [id]);
  forceSave();
}

export async function getSavedJobCount(candidateId: number): Promise<number> {
  const database = await getDb();
  const result = database.exec(
    "SELECT COUNT(*) FROM candidate_saved_jobs WHERE candidate_id = ?",
    [candidateId]
  );
  return result.length > 0 ? (result[0].values[0][0] as number) : 0;
}

// ── Saved jobs ──

export async function getSavedJobUrls(
  candidateId: number
): Promise<string[]> {
  const database = await getDb();
  const result = database.exec(
    "SELECT job_url FROM candidate_saved_jobs WHERE candidate_id = ? ORDER BY saved_at DESC",
    [candidateId]
  );

  if (result.length === 0) return [];
  return result[0].values.map((row) => row[0] as string);
}

export async function saveJob(
  candidateId: number,
  jobUrl: string
): Promise<void> {
  const database = await getDb();
  database.run(
    "INSERT OR IGNORE INTO candidate_saved_jobs (candidate_id, job_url) VALUES (?, ?)",
    [candidateId, jobUrl]
  );
  forceSave();
}

export async function unsaveJob(
  candidateId: number,
  jobUrl: string
): Promise<void> {
  const database = await getDb();
  database.run(
    "DELETE FROM candidate_saved_jobs WHERE candidate_id = ? AND job_url = ?",
    [candidateId, jobUrl]
  );
  forceSave();
}

export async function getSavedJobs(candidateId: number): Promise<Job[]> {
  const database = await getDb();
  const result = database.exec(
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
    LEFT JOIN company_enrichment ce ON ce.id = (SELECT id FROM company_enrichment WHERE lower(company_name) = lower(j.company) LIMIT 1)
    WHERE csj.candidate_id = ?
    ORDER BY csj.saved_at DESC
  `,
    [candidateId]
  );

  const jobs: Job[] = [];
  if (result.length > 0) {
    const columns = result[0].columns;
    for (const row of result[0].values) {
      const job: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        job[col] = row[i];
      });
      jobs.push(job as unknown as Job);
    }
  }

  return jobs;
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

function rowToObject(columns: string[], row: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

export async function createEmployer(
  name: string,
  email: string,
  company_name: string
): Promise<number> {
  const database = await getDb();
  database.run(
    "INSERT INTO employers (name, email, company_name) VALUES (?, ?, ?)",
    [name, email.toLowerCase().trim(), company_name]
  );
  const result = database.exec("SELECT last_insert_rowid()");
  forceSave();
  return result[0].values[0][0] as number;
}

export async function getEmployerByEmail(email: string): Promise<Employer | null> {
  const database = await getDb();
  const result = database.exec("SELECT * FROM employers WHERE email = ?", [email.toLowerCase().trim()]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToObject(result[0].columns, result[0].values[0]) as unknown as Employer;
}

export async function getEmployerById(id: number): Promise<Employer | null> {
  const database = await getDb();
  const result = database.exec("SELECT * FROM employers WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToObject(result[0].columns, result[0].values[0]) as unknown as Employer;
}

export async function createEmployerSession(
  employer_id: number,
  token: string,
  expires_at: string
): Promise<void> {
  const database = await getDb();
  database.run(
    "INSERT INTO employer_sessions (employer_id, token, expires_at) VALUES (?, ?, ?)",
    [employer_id, token, expires_at]
  );
  forceSave();
}

export async function getEmployerBySessionToken(token: string): Promise<Employer | null> {
  const database = await getDb();
  const result = database.exec(
    `SELECT e.* FROM employers e
     JOIN employer_sessions es ON es.employer_id = e.id
     WHERE es.token = ? AND es.expires_at > datetime('now')`,
    [token]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToObject(result[0].columns, result[0].values[0]) as unknown as Employer;
}

export async function deleteEmployerSession(token: string): Promise<void> {
  const database = await getDb();
  database.run("DELETE FROM employer_sessions WHERE token = ?", [token]);
  forceSave();
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
  const database = await getDb();
  database.run(
    `INSERT INTO employer_submitted_jobs (employer_id, job_url, job_id, scraped_title, scraped_company, scraped_location, scraped_description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employer_id, job_url, job_id ?? null, scraped_title, scraped_company, scraped_location, scraped_description]
  );
  const result = database.exec("SELECT last_insert_rowid()");
  forceSave();
  return result[0].values[0][0] as number;
}

export async function getEmployerSubmissions(employer_id: number): Promise<EmployerSubmission[]> {
  const database = await getDb();
  const result = database.exec(
    `SELECT esj.*, COALESCE(j.verified, 0) as verified
     FROM employer_submitted_jobs esj
     LEFT JOIN jobs j ON esj.job_id = j.id
     WHERE esj.employer_id = ?
     ORDER BY esj.submitted_at DESC`,
    [employer_id]
  );
  if (result.length === 0) return [];
  return result[0].values.map(row =>
    rowToObject(result[0].columns, row) as unknown as EmployerSubmission
  );
}

export async function getEmployerSubmissionById(id: number): Promise<EmployerSubmission | null> {
  const database = await getDb();
  const result = database.exec("SELECT * FROM employer_submitted_jobs WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return rowToObject(result[0].columns, result[0].values[0]) as unknown as EmployerSubmission;
}

export async function getAllPendingSubmissions(): Promise<EmployerSubmission[]> {
  const database = await getDb();
  const result = database.exec(
    `SELECT esj.*, e.name as employer_name, e.company_name as employer_company
     FROM employer_submitted_jobs esj
     JOIN employers e ON esj.employer_id = e.id
     ORDER BY
       CASE WHEN esj.status = 'pending' THEN 0 ELSE 1 END ASC,
       CASE WHEN esj.status = 'pending' THEN esj.submitted_at ELSE esj.reviewed_at END DESC
     LIMIT 100`
  );
  if (result.length === 0) return [];
  return result[0].values.map(row =>
    rowToObject(result[0].columns, row) as unknown as EmployerSubmission
  );
}

export async function updateSubmissionJobId(submissionId: number, jobId: number): Promise<void> {
  const database = await getDb();
  database.run("UPDATE employer_submitted_jobs SET job_id = ? WHERE id = ?", [jobId, submissionId]);
  forceSave();
}

export async function approveSubmission(id: number): Promise<void> {
  const database = await getDb();
  database.run(
    "UPDATE employer_submitted_jobs SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?",
    [id]
  );
  // If job_id exists, set verified and employer_id on the job
  const sub = database.exec("SELECT job_id, employer_id FROM employer_submitted_jobs WHERE id = ?", [id]);
  if (sub.length > 0 && sub[0].values.length > 0) {
    const jobId = sub[0].values[0][0] as number | null;
    const employerId = sub[0].values[0][1] as number;
    if (jobId) {
      database.run("UPDATE jobs SET verified = 1, employer_id = ? WHERE id = ?", [employerId, jobId]);
    }
  }
  forceSave();
}

export async function rejectSubmission(id: number, reason?: string): Promise<void> {
  const database = await getDb();
  database.run(
    "UPDATE employer_submitted_jobs SET status = 'rejected', reviewed_at = datetime('now'), rejection_reason = ? WHERE id = ?",
    [reason || null, id]
  );
  forceSave();
}

export async function getOrCreateJobFromUrl(
  url: string,
  scraped_title: string | null,
  scraped_company: string | null,
  scraped_location: string | null,
  scraped_description: string | null
): Promise<{ job_id: number; was_duplicate: boolean }> {
  const database = await getDb();

  // Check if job URL already exists
  const existing = database.exec("SELECT id FROM jobs WHERE url = ?", [url]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    return { job_id: existing[0].values[0][0] as number, was_duplicate: true };
  }

  // Create new job with status='open'
  database.run(
    `INSERT INTO jobs (title, company, location, url, status, description_snippet, first_seen_at)
     VALUES (?, ?, ?, ?, 'open', ?, datetime('now'))`,
    [
      scraped_title || "Untitled Role",
      scraped_company || "Unknown Company",
      scraped_location || null,
      url,
      scraped_description ? scraped_description.slice(0, 500) : null,
    ]
  );
  const result = database.exec("SELECT last_insert_rowid()");
  forceSave();
  return { job_id: result[0].values[0][0] as number, was_duplicate: false };
}

// ── Admin job management ──

export async function adminSearchJobs(params: {
  search?: string;
  status?: string;
  source?: string;
  page: number;
  limit: number;
}): Promise<{ jobs: Record<string, unknown>[]; total: number }> {
  const database = await getDb();
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

  const countResult = database.exec(
    `SELECT COUNT(*) FROM jobs ${whereClause}`,
    bindParams
  );
  const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  const offset = (params.page - 1) * params.limit;
  const dataResult = database.exec(
    `SELECT id, title, company, location, url AS job_url, source, status, posted_date, first_seen_at,
            salary_range, country
     FROM jobs ${whereClause}
     ORDER BY first_seen_at DESC
     LIMIT ? OFFSET ?`,
    [...bindParams, params.limit, offset]
  );

  const jobs: Record<string, unknown>[] = [];
  if (dataResult.length > 0) {
    const columns = dataResult[0].columns;
    for (const row of dataResult[0].values) {
      jobs.push(rowToObject(columns, row));
    }
  }

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
  const database = await getDb();
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
  database.run(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`, params);
  forceSave();
}

export async function deleteJob(id: number, hard?: boolean): Promise<void> {
  const database = await getDb();
  if (hard) {
    database.run("DELETE FROM jobs WHERE id = ?", [id]);
  } else {
    database.run("UPDATE jobs SET status = ? WHERE id = ?", ["closed", id]);
  }
  forceSave();
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
  const database = await getDb();
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

  const countResult = database.exec(
    `SELECT COUNT(*) FROM candidates ${whereClause}`,
    bindParams
  );
  const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  const offset = (params.page - 1) * params.limit;
  const dataResult = database.exec(
    `SELECT * FROM candidates ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...bindParams, params.limit, offset]
  );

  const candidates: Record<string, unknown>[] = [];
  if (dataResult.length > 0) {
    const columns = dataResult[0].columns;
    for (const row of dataResult[0].values) {
      candidates.push(rowToObject(columns, row));
    }
  }

  return { candidates, total };
}

// ── Admin token queries ──

export async function createAdminTokenRecord(
  tokenHash: string,
  email: string,
  expiresAt: string
): Promise<void> {
  const database = await getDb();
  database.run(
    "INSERT INTO admin_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)",
    [tokenHash, email, expiresAt]
  );
  forceSave();
}

export async function consumeAdminToken(
  tokenHash: string
): Promise<{ email: string } | null> {
  const database = await getDb();
  const result = database.exec(
    "SELECT email FROM admin_tokens WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')",
    [tokenHash]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  database.run(
    "UPDATE admin_tokens SET used = 1 WHERE token_hash = ?",
    [tokenHash]
  );
  forceSave();

  return { email: result[0].values[0][0] as string };
}
