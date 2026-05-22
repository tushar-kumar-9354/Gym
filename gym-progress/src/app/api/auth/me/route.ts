import { NextResponse } from "next/server";
import { readUsers, writeUsers, verifyToken, isExpired } from "@/lib/auth";

const AUTH_SECRET = process.env.AUTH_SECRET || "change-me";
const COOKIE_NAME = "client_auth";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const tokenMatch = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  if (!tokenMatch) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = tokenMatch.split("=")[1];
  const payload = verifyToken(token, AUTH_SECRET);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

// @ts-ignore
  const email = String((payload as any).email || "").toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Invalid session payload" }, { status: 401 });
  }

  const users = await readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let message: string | undefined;
  if (isExpired(user.validUntil)) {
    user.status = "locked";
    message = "Your access has expired and your account is locked. Contact admin to renew.";
    user.updatedAt = new Date().toISOString();
    await writeUsers(users);
  }

  const sanitized = {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    validUntil: user.validUntil,
    message,
  };

  return NextResponse.json({ user: sanitized });
}
