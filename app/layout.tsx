import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Inter_Tight } from "next/font/google";

import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: {
    default: "KIOSQ Study Cafe OS",
    template: "%s | KIOSQ"
  },
  description: "Premium self-service study cafe operating system for South Korea.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="ko" suppressHydrationWarning>
        <body className={`${inter.variable} ${interTight.variable} antialiased`}>
          <PostHogProvider>{children}</PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
