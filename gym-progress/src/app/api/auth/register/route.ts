import { NextResponse } from "next/server";
import { AppUser, readUsers, writeUsers, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").toLowerCase().trim();
  const name = String(body.name || "").trim();
  const password = String(body.password || "");

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const users = await readUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email || u.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return NextResponse.json({ error: "A user with that email or username already exists" }, { status: 409 });
  }

  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 1);

  const newUser: AppUser = {
    email,
    name,
    role: "client",
    passwordHash: hashPassword(password),
    status: "active",
    validUntil: validUntil.toISOString(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  return NextResponse.json({ ok: true, validUntil: newUser.validUntil });
}
