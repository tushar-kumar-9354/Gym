import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import MainWrapper from "@/components/MainWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GymProgress+ | Track Your Fitness Journey",
  description: "Secure, fast, SEO-optimized web application to track daily gym progress, diet, and strength.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col antialiased`}>
        <TopNav />
        <MainWrapper>
          {children}
        </MainWrapper>
      </body>
    </html>
  );
}
