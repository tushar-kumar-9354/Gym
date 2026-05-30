import crypto from "crypto";
import db from "./db";

export type AppUser = {
  email: string;
  name: string;
  role: "client" | "admin";
  passwordHash: string;
  status: "active" | "locked";
  validUntil: string;
  createdAt: string;
  updatedAt?: string;
};

export async function readUsers(): Promise<AppUser[]> {
  const stmt = db.prepare('SELECT * FROM users');
  return stmt.all() as AppUser[];
}

// If the database is empty, try seeding from a checked-in serverUsers.json file
export async function ensureSeededUsers(): Promise<void> {
  try {
    const users = await readUsers();
    if (Array.isArray(users) && users.length > 0) return;

    // Attempt to load seed file
    const path = require('path');
    const fs = require('fs');
    const seedPath = path.join(process.cwd(), 'data', 'serverUsers.json');
    if (!fs.existsSync(seedPath)) return;

    const raw = fs.readFileSync(seedPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const seeded: AppUser[] = parsed.map((u: any) => ({
      email: String(u.email || '').toLowerCase().trim(),
      name: String(u.name || ''),
      role: (u.role || 'client') as AppUser['role'],
      passwordHash: String(u.passwordHash || ''),
      status: (u.status || 'active') as AppUser['status'],
      validUntil: u.validUntil || new Date().toISOString(),
      createdAt: u.createdAt || new Date().toISOString(),
      updatedAt: u.updatedAt || undefined,
    }));

    await writeUsers(seeded);
    console.log('Seeded users from data/serverUsers.json');
  } catch (err) {
    // non-fatal
  }
}

export async function writeUsers(users: AppUser[]): Promise<void> {
  const emailsToKeep = users.map(u => u.email.toLowerCase().trim());
  
  // Prepare upsert statement
  const upsertStmt = db.prepare(`
    INSERT INTO users (email, name, role, passwordHash, status, validUntil, createdAt, updatedAt)
    VALUES (@email, @name, @role, @passwordHash, @status, @validUntil, @createdAt, @updatedAt)
    ON CONFLICT(email) DO UPDATE SET
      name=excluded.name,
      role=excluded.role,
      passwordHash=excluded.passwordHash,
      status=excluded.status,
      validUntil=excluded.validUntil,
      updatedAt=excluded.updatedAt
  `);

  const transaction = db.transaction((usersToInsert: AppUser[]) => {
    // 1. Fetch current database users to identify whom to delete (if any have been removed by admin)
    const allUsers = db.prepare('SELECT email FROM users').all() as { email: string }[];
    for (const dbUser of allUsers) {
      if (!emailsToKeep.includes(dbUser.email.toLowerCase().trim())) {
        db.prepare('DELETE FROM users WHERE email = ?').run(dbUser.email);
      }
    }

    // 2. Upsert list to update or insert users without cascading deletes
    for (const user of usersToInsert) {
      upsertStmt.run({
        ...user,
        email: user.email.toLowerCase().trim(),
        updatedAt: user.updatedAt || null
      });
    }
  });

  transaction(users);
}

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function signToken(payload: object, secret: string) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const mac = crypto.createHmac("sha256", secret).update(data).digest("base64");
  return `${data}.${mac}`;
}

export function verifyToken(token: string, secret: string) {
  try {
    const [data, mac] = token.split(".");
    if (!data || !mac) return null;
    const expected = crypto.createHmac("sha256", secret).update(data).digest("base64");
    if (expected !== mac) return null;
    return JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function isExpired(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  return target.getTime() < now.getTime();
}

export function authCookieOptions(name: string) {
  const secure = process.env.NODE_ENV === "production";
  return `${name}=; HttpOnly; Path=/; SameSite=Strict${secure ? "; Secure" : ""}`;
}
