import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

const AUTH_SECRET = process.env.AUTH_SECRET || "change-me";
const COOKIE_NAME = "admin_auth";
const ADMIN_CREDENTIALS = {
  name: "super-admin",
  password: "super-admin-password",
};

export async function POST(request: Request) {
  const body = await request.json();
  const identifier = String(body.identifier || "").trim();
  const password = String(body.password || "").trim();

  if (!identifier || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  if (identifier !== ADMIN_CREDENTIALS.name || password !== ADMIN_CREDENTIALS.password) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
  }

  const token = signToken({ role: "super-admin", name: ADMIN_CREDENTIALS.name, iat: Date.now() }, AUTH_SECRET);
  const response = NextResponse.json({ ok: true, user: { name: ADMIN_CREDENTIALS.name, role: "super-admin" } });
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}
