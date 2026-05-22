import { NextResponse } from "next/server";
import { readUsers, writeUsers, hashPassword, signToken, verifyToken, isExpired } from "@/lib/auth";

const AUTH_SECRET = process.env.AUTH_SECRET || "change-me";
const COOKIE_NAME = "client_auth";

export async function POST(request: Request) {
  const body = await request.json();
  const identifier = String(body.identifier || "").toLowerCase().trim();
  const password = String(body.password || "");

  if (!identifier || !password) {
    return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });
  }

  const users = await readUsers();
  const user = users.find((u) => u.email.toLowerCase() === identifier || u.name.toLowerCase() === identifier);

  if (!user || user.role !== "client") {
    return NextResponse.json({ error: "Client account not found" }, { status: 401 });
  }

  if (user.status === "locked") {
    return NextResponse.json({ error: "Your account is locked. Contact admin to unlock it." }, { status: 403 });
  }

  if (isExpired(user.validUntil)) {
    user.status = "locked";
    user.updatedAt = new Date().toISOString();
    await writeUsers(users);
    return NextResponse.json({ error: "Your account has expired and has been locked. Contact admin to renew." }, { status: 403 });
  }

  if (user.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = signToken({ email: user.email, role: user.role, name: user.name, iat: Date.now() }, AUTH_SECRET);
  const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role, validUntil: user.validUntil } });
  res.headers.append("Set-Cookie", `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res;
}
