import { NextResponse } from "next/server";

// In-memory store for OTPs (Dev only, will reset on restart)
// In a real app, this should be in Redis or Database
const otpStore = new Map<string, string>();

export async function POST(request: Request) {
  const body = await request.json();
  const { action, email, otp } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Handle Send OTP
  if (action === "send") {
    // Generate random 4 digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(email, generatedOtp);

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.log(`[DEV] OTP for ${email} is ${generatedOtp}`);
      return NextResponse.json({ 
        success: true, 
        message: "Resend API key missing. OTP logged in console or use fallback '1234'.",
        devOtp: generatedOtp // Returning it for dev convenience
      });
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "GymProgress+ <onboarding@resend.dev>",
          to: email,
          subject: "Your GymProgress+ Login OTP",
          html: `<p>Your One-Time Password for login is: <strong>${generatedOtp}</strong></p>`,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        return NextResponse.json({ success: true, message: "Email sent successfully" });
      } else {
        return NextResponse.json({ error: data.message || "Failed to send email" }, { status: 500 });
      }
    } catch (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // Handle Verify OTP
  if (action === "verify") {
    const storedOtp = otpStore.get(email);
    
    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    if (otp === storedOtp || otp === "1234") { // Allow 1234 as fallback for dev
      otpStore.delete(email); // Consume OTP
      return NextResponse.json({ success: true, message: "Logged in successfully" });
    } else {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
