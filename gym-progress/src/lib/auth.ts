import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const USERS_FILE = path.join(process.cwd(), "data", "serverUsers.json");

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
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    // Handle both plain array and { users: [] } formats
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.users)) return parsed.users;
    return [];
  } catch (error) {
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    await fs.writeFile(USERS_FILE, "[]", "utf8");
    return [];
  }
}

export async function writeUsers(users: AppUser[]) {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
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
