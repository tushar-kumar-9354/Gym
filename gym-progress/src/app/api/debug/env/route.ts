import { NextResponse } from "next/server";

export async function GET() {
  const envs = {
    USDA_API_KEY: !!process.env.USDA_API_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GROQ_API_KEY_2: !!process.env.GROQ_API_KEY_2,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
  };

  return NextResponse.json({
    ok: true,
    envs,
    note: "This endpoint only reports presence (true/false) of environment variables. It does NOT return secret values. Remove after verification in production.",
  });
}
