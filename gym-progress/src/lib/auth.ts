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

export async function writeUsers(users: AppUser[]): Promise<void> {
  const deleteStmt = db.prepare('DELETE FROM users');
  const insertStmt = db.prepare(`
    INSERT INTO users (email, name, role, passwordHash, status, validUntil, createdAt, updatedAt)
    VALUES (@email, @name, @role, @passwordHash, @status, @validUntil, @createdAt, @updatedAt)
  `);

  const transaction = db.transaction((usersToInsert: AppUser[]) => {
    deleteStmt.run();
    for (const user of usersToInsert) {
      insertStmt.run({
        ...user,
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
