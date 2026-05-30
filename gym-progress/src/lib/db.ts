import path from 'path';
import fs from 'fs';

// Define the interface for the user and sync data
interface UserRow {
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  status: string;
  validUntil: string;
  createdAt: string;
  updatedAt?: string | null;
}

interface SyncRow {
  email: string;
  key: string;
  value: string;
}

class JsonFallbackDatabase {
  private filePath: string;
  private data: {
    users: UserRow[];
    sync_data: SyncRow[];
  };

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'app_db.json');
    this.data = { users: [], sync_data: [] };
    this.load();
  }

  private load() {
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
      // If no users recorded yet, try seeding from a checked-in serverUsers.json
      try {
        const seedPath = path.join(process.cwd(), 'data', 'serverUsers.json');
        if (this.data && Array.isArray(this.data.users) && this.data.users.length === 0 && fs.existsSync(seedPath)) {
          const seedContent = fs.readFileSync(seedPath, 'utf8');
          const seeded = JSON.parse(seedContent);
          if (Array.isArray(seeded) && seeded.length > 0) {
            this.data.users = seeded.map((u: any) => ({ ...u }));
            this.save();
            console.log("Seeded JSON fallback DB from data/serverUsers.json");
          }
        }
      } catch (seedErr) {
        // non-fatal
      }
    } catch (e) {
      console.warn("Failed to load JSON database from path, using in-memory only:", e);
    }
  }

  private save() {
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      // In serverless, writing to process.cwd() might fail, so try writing to /tmp as fallback
      try {
        const tmpPath = path.join('/tmp', 'app_db.json');
        const tmpDir = path.dirname(tmpPath);
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
        this.filePath = tmpPath; // switch to tmp path
      } catch (err2) {
        console.warn("Failed to save JSON database to /tmp, running in-memory only:", err2);
      }
    }
  }

  pragma(sql: string) {
    // No-op for fallback
  }

  exec(sql: string) {
    // No-op for fallback
  }

  prepare(sql: string) {
    const normalizedSql = sql.trim().replace(/\s+/g, ' ');

    // 1. SELECT * FROM users
    if (normalizedSql.match(/^SELECT \* FROM users$/i)) {
      return {
        all: () => {
          this.load();
          return this.data.users.map(u => ({
            ...u,
            updatedAt: u.updatedAt || null
          }));
        },
        run: () => { throw new Error("Run not supported on SELECT"); }
      };
    }

    // SELECT email FROM users
    if (normalizedSql.match(/^SELECT email FROM users$/i)) {
      return {
        all: () => {
          this.load();
          return this.data.users.map(u => ({ email: u.email }));
        },
        run: () => { throw new Error("Run not supported on SELECT"); }
      };
    }

    // 2. DELETE FROM users [WHERE email = ?]
    if (normalizedSql.match(/^DELETE FROM users/i)) {
      if (normalizedSql.match(/WHERE email = \?/i)) {
        return {
          all: () => { throw new Error("All not supported on DELETE"); },
          run: (email: string) => {
            this.load();
            const targetEmail = (email || '').toLowerCase().trim();
            const countBefore = this.data.users.length;
            this.data.users = this.data.users.filter(u => u.email.toLowerCase() !== targetEmail);
            // Cascade delete sync data
            this.data.sync_data = this.data.sync_data.filter(row => row.email.toLowerCase() !== targetEmail);
            this.save();
            return { changes: countBefore - this.data.users.length };
          }
        };
      }
      return {
        all: () => { throw new Error("All not supported on DELETE"); },
        run: () => {
          this.load();
          const count = this.data.users.length;
          this.data.users = [];
          this.data.sync_data = [];
          this.save();
          return { changes: count };
        }
      };
    }

    // 3. INSERT INTO users ...
    if (normalizedSql.match(/^INSERT INTO users/i)) {
      return {
        all: () => { throw new Error("All not supported on INSERT"); },
        run: (params: any) => {
          this.load();
          const email = (params.email || '').toLowerCase().trim();
          // Remove existing user with same email
          this.data.users = this.data.users.filter(u => u.email.toLowerCase() !== email);
          this.data.users.push({
            email,
            name: params.name || '',
            role: params.role || 'client',
            passwordHash: params.passwordHash || '',
            status: params.status || 'active',
            validUntil: params.validUntil || '',
            createdAt: params.createdAt || '',
            updatedAt: params.updatedAt || null
          });
          this.save();
          return { changes: 1 };
        }
      };
    }

    // 4. SELECT key, value FROM sync_data WHERE email = ?
    if (normalizedSql.match(/^SELECT key, value FROM sync_data WHERE email = \?/i)) {
      return {
        all: (email: string) => {
          this.load();
          const targetEmail = (email || '').toLowerCase().trim();
          return this.data.sync_data
            .filter(row => row.email.toLowerCase() === targetEmail)
            .map(row => ({ key: row.key, value: row.value }));
        },
        run: () => { throw new Error("Run not supported on SELECT"); }
      };
    }

    // 5. DELETE FROM sync_data WHERE email = ? AND key = ?
    if (normalizedSql.match(/^DELETE FROM sync_data WHERE email = \? AND key = \?/i)) {
      return {
        all: () => { throw new Error("All not supported on DELETE"); },
        run: (email: string, key: string) => {
          this.load();
          const targetEmail = (email || '').toLowerCase().trim();
          const countBefore = this.data.sync_data.length;
          this.data.sync_data = this.data.sync_data.filter(
            row => !(row.email.toLowerCase() === targetEmail && row.key === key)
          );
          this.save();
          return { changes: countBefore - this.data.sync_data.length };
        }
      };
    }

    // 6. INSERT INTO sync_data (email, key, value) ... ON CONFLICT
    if (normalizedSql.match(/^INSERT INTO sync_data/i)) {
      return {
        all: () => { throw new Error("All not supported on INSERT"); },
        run: (params: any) => {
          this.load();
          const email = (params.email || '').toLowerCase().trim();
          const key = params.key;
          const value = params.value;

          // Remove conflict
          this.data.sync_data = this.data.sync_data.filter(
            row => !(row.email.toLowerCase() === email && row.key === key)
          );
          this.data.sync_data.push({ email, key, value });
          this.save();
          return { changes: 1 };
        }
      };
    }

    // 7. DELETE FROM sync_data
    if (normalizedSql.match(/^DELETE FROM sync_data$/i)) {
      return {
        all: () => { throw new Error("All not supported on DELETE"); },
        run: () => {
          this.load();
          const count = this.data.sync_data.length;
          this.data.sync_data = [];
          this.save();
          return { changes: count };
        }
      };
    }

    throw new Error(`Unhandled fallback database query: ${sql}`);
  }

  transaction(fn: Function) {
    return (...args: any[]) => {
      this.load();
      const res = fn(...args);
      this.save();
      return res;
    };
  }
}

let db: any;

try {
  // Dynamically load better-sqlite3 to prevent loading/compilation crashes on environments without it
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'data', 'app.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqliteDb = new Database(dbPath, { timeout: 8000 });
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('busy_timeout = 8000');

  // Create tables if they don't exist
  sqliteDb.exec(`
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

  db = sqliteDb;
  console.log("Successfully initialized SQLite database using better-sqlite3.");
} catch (e: any) {
  console.warn("Failed to initialize better-sqlite3 database. Falling back to robust JSON DB wrapper. Error:", e.message || e);
  db = new JsonFallbackDatabase();
}

export default db;
