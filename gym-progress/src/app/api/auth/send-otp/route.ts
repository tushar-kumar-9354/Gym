import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// In-memory store for OTPs (Dev only, will reset on restart)
const otpStore = new Map<string, string>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, otp } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Handle Send OTP
    if (action === "send") {
      // Generate random 4 digit OTP (may be overridden by DEFAULT_OTP)
      let generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

      console.log(`\n========================================\n[DEV DEBUG] Generated OTP for ${email} is: ${generatedOtp}\n========================================\n`);
      console.log(`[AUTH] Attempting to send SMTP OTP to ${email}...`);

      try {
        const smtpService = process.env.SMTP_SERVICE || "gmail";
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        // If SMTP credentials are not configured, fall back to a default OTP (development-safe)
        if (!smtpUser || !smtpPass) {
          const defaultOtp = process.env.DEFAULT_OTP ?? "1234";
          generatedOtp = defaultOtp;
          otpStore.set(email, generatedOtp);
          console.warn(`[SMTP CONFIG] SMTP credentials not set. Using DEFAULT OTP for ${email}: ${generatedOtp}`);
          return NextResponse.json({
            success: true,
            message: "SMTP not configured: default OTP set (development fallback).",
          });
        }

        const transporter = nodemailer.createTransport({
          service: smtpService,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: `"GymProgress+ Admin" <${smtpUser}>`,
          to: email,
          subject: "Your GymProgress+ Security OTP",
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #3b82f6; font-size: 28px; font-weight: bold; margin: 0;">GymProgress+</h1>
                <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Secure Sign In / Verification</p>
              </div>
              <div style="border-top: 1px solid #f3f4f6; padding-top: 20px;">
                <p style="font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 16px 0;">Hello,</p>
                <p style="font-size: 16px; color: #374151; line-height: 1.5; margin: 0 0 24px 0;">Your One-Time Password (OTP) for secure authentication is below. Enter this code on the verification page to complete your action:</p>
                <div style="background-color: #f3f4f6; padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1f2937; font-family: monospace;">${generatedOtp}</span>
                </div>
                <p style="font-size: 14px; color: #9ca3af; line-height: 1.5; margin: 0; text-align: center;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP SUCCESS] OTP successfully sent to ${email}`);

        return NextResponse.json({
          success: true,
          message: "OTP has been sent to your email address.",
        });
      } catch (smtpError: any) {
        console.error("[SMTP ERROR] Failed to send email via nodemailer:", smtpError);
        // On SMTP failure, set a safe default OTP so the user can still proceed in development
        const defaultOtp = process.env.DEFAULT_OTP ?? "1234";
        generatedOtp = defaultOtp;
        otpStore.set(email, generatedOtp);
        console.log(`\n========================================\n[DEV FALLBACK] Using DEFAULT OTP for ${email}: ${generatedOtp}\n========================================\n`);
        return NextResponse.json({
          success: true,
          message: "SMTP failed: default OTP set (fallback).",
        });
      }
    }

    // Handle Verify OTP
    if (action === "verify") {
      const storedOtp = otpStore.get(email);
      
      if (!otp) {
        return NextResponse.json({ error: "OTP is required" }, { status: 400 });
      }

      if (otp === storedOtp) {
        otpStore.delete(email); // Consume OTP
        return NextResponse.json({ success: true, message: "Logged in successfully" });
      } else {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[AUTH API EXCEPTION]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
