import { NextResponse } from "next/server";
import { getUserSyncData, updateUserSyncData } from "@/lib/syncStorage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const data = await getUserSyncData(email);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("GET /api/sync error:", error);
    return NextResponse.json({ error: "Failed to get sync data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, updates, removals } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await updateUserSyncData(email, updates || {}, removals || []);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/sync error:", error);
    return NextResponse.json({ error: "Failed to update sync data" }, { status: 500 });
  }
}
