import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'app.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database with timeout to avoid 'database is locked' errors during parallel builds
const db = new Database(dbPath, { timeout: 8000 });

try {
  // Enable WAL mode for better performance and concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 8000');

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      status TEXT NOT NULL,
      validUntil TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_data (
      email TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (email, key),
      FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
    );
  `);
} catch (e: any) {
  // During Next.js static build, multiple workers evaluate this module simultaneously.
  // We can safely ignore SQLITE_BUSY here because at least one worker will succeed 
  // in setting WAL mode and creating the tables.
  if (e.code !== 'SQLITE_BUSY') {
    throw e;
  }
}

export default db;
