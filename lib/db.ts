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

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);

  // Create candidate tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role_types TEXT,
      location TEXT,
      remote_pref TEXT,
      status TEXT DEFAULT 'open',
      alert_freq TEXT DEFAULT 'weekly',
      verified INTEGER DEFAULT 0,
      verification_token TEXT,
      token_expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_active_at TEXT
    )
  `);

  // Migrate: add linkedin/cv columns if they don't exist
  try {
    db.run("ALTER TABLE candidates ADD COLUMN linkedin_url TEXT");
  } catch { /* column already exists */ }
  try {
    db.run("ALTER TABLE candidates ADD COLUMN cv_filename TEXT");
  } catch { /* column already exists */ }
  try {
    db.run("ALTER TABLE candidates ADD COLUMN cv_path TEXT");
  } catch { /* column already exists */ }

  // Migrate: add featured column to jobs table if it doesn't exist
  try {
    db.run("ALTER TABLE jobs ADD COLUMN featured INTEGER DEFAULT 0");
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
  se: "Solutions Engineer",
  fde: "Forward Deployed Engineer",
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

  // Search
  if (search) {
    conditions.push(
      "(lower(j.title) LIKE ? OR lower(j.company) LIKE ?)"
    );
    bindParams.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
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

  const whereClause = conditions.join(" AND ");
  const orderBy =
    sort === "discovered"
      ? "j.first_seen_at DESC"
      : "COALESCE(j.posted_date, j.first_seen_at) DESC";

  // Count query
  const countSql = `
    SELECT COUNT(DISTINCT j.id)
    FROM jobs j
    LEFT JOIN company_enrichment ce ON lower(j.company) = lower(ce.company_name)
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
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON lower(j.company) = lower(ce.company_name)
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
    LEFT JOIN company_enrichment ce ON lower(j.company) = lower(ce.company_name)
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
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON lower(j.company) = lower(ce.company_name)
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
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM jobs j
    LEFT JOIN company_enrichment ce ON lower(j.company) = lower(ce.company_name)
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
}

export async function upsertCandidate(
  email: string,
  name: string,
  roleTypes: string[],
  linkedinUrl?: string,
  cvFilename?: string,
  cvPath?: string
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
      "UPDATE candidates SET name = ?, role_types = ?, linkedin_url = COALESCE(?, linkedin_url), cv_filename = COALESCE(?, cv_filename), cv_path = COALESCE(?, cv_path), last_active_at = datetime('now') WHERE email = ?",
      [name, roleTypesJson, linkedinUrl || null, cvFilename || null, cvPath || null, email]
    );
  } else {
    database.run(
      "INSERT INTO candidates (email, name, role_types, linkedin_url, cv_filename, cv_path) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, roleTypesJson, linkedinUrl || null, cvFilename || null, cvPath || null]
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
      ce.funding_stage, ce.total_raised, ce.last_funded_date,
      ce.employee_count, ce.industries, ce.description, ce.domain
    FROM candidate_saved_jobs csj
    JOIN jobs j ON j.url = csj.job_url
    LEFT JOIN company_enrichment ce ON lower(j.company) = lower(ce.company_name)
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
