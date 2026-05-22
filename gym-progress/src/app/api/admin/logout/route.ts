import { NextResponse } from "next/server";
import { authCookieOptions } from "@/lib/auth";

const COOKIE_NAME = "admin_auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", authCookieOptions(COOKIE_NAME));
  return response;
}
