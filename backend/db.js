import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "pgms.db"));

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','owner')),
  phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pgs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  price INTEGER NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'pg' CHECK(property_type IN ('pg','flat')),
  gender_allowed TEXT DEFAULT 'any',
  wifi INTEGER DEFAULT 0,
  food INTEGER DEFAULT 0,
  laundry INTEGER DEFAULT 0,
  ac INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 0,
  power_backup INTEGER DEFAULT 0,
  total_rooms INTEGER DEFAULT 1,
  available_rooms INTEGER DEFAULT 1,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pg_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pg_id INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('cover','bedroom','kitchen','bathroom','lobby','garden','exterior','pool')),
  url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pg_id INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cleanliness INTEGER NOT NULL CHECK(cleanliness BETWEEN 1 AND 5),
  wifi_rating INTEGER NOT NULL CHECK(wifi_rating BETWEEN 1 AND 5),
  price_value INTEGER NOT NULL CHECK(price_value BETWEEN 1 AND 5),
  safety INTEGER NOT NULL CHECK(safety BETWEEN 1 AND 5),
  owner_behavior INTEGER NOT NULL CHECK(owner_behavior BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pg_id, student_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pg_id INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
  digital_key TEXT UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Migration: databases created before property_type existed get the column added
const pgCols = db.prepare("PRAGMA table_info(pgs)").all().map((c) => c.name);
if (!pgCols.includes("property_type")) {
  db.exec("ALTER TABLE pgs ADD COLUMN property_type TEXT NOT NULL DEFAULT 'pg'");
}

export default db;
