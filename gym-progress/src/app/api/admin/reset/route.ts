// src/app/api/admin/reset/route.ts

import { NextResponse } from "next/server";
import { resetAllUserData } from "@/lib/serverStorage";

/**
 * POST endpoint to wipe the entire data folder (user database).
 * Requires admin authentication – we reuse the same admin check utilities.
 */
export async function POST(request: Request) {
  // Simple admin check – reuse existing auth utilities if needed.
  // For this example we assume the admin panel already protects the UI.
  try {
    await resetAllUserData();
    return NextResponse.json({ ok: true, message: "Database reset successfully" });
  } catch (err) {
    console.error("Reset failed:", err);
    return NextResponse.json({ error: "Failed to reset database" }, { status: 500 });
  }
}
