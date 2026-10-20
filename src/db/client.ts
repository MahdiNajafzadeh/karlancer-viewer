import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const dbPath = resolve(process.cwd(), "data", "karlancer.db");
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });

// Ensure tables exist (simple bootstrap; drizzle-kit for migrations)
sqlite.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  short_url TEXT,
  status TEXT,
  country TEXT,
  category_id INTEGER,
  min_budget REAL DEFAULT 0,
  max_budget REAL DEFAULT 0,
  budget REAL DEFAULT 0,
  duration INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  bids INTEGER DEFAULT 0,
  urgent INTEGER DEFAULT 0,
  fulltime INTEGER DEFAULT 0,
  onsite INTEGER DEFAULT 0,
  highlight INTEGER DEFAULT 0,
  ladder INTEGER DEFAULT 0,
  pin INTEGER DEFAULT 0,
  multi INTEGER DEFAULT 0,
  low_hire INTEGER DEFAULT 0,
  expired INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  skills TEXT,
  past_time TEXT,
  user_id INTEGER,
  token INTEGER,
  description TEXT,
  starred INTEGER DEFAULT 0,
  fetched_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`);
// Migrate existing DBs: add missing columns
for (const col of ["description TEXT", "starred INTEGER DEFAULT 0"]) {
  try { sqlite.exec(`ALTER TABLE projects ADD COLUMN ${col};`); } catch {}
}
