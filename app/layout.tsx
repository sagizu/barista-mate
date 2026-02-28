import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barista Mate | העוזר האישי לקפה",
  description: "Smart Dial-In Assistant & People & Orders Manager",
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-hebrew min-h-screen text-[#EAE0D5] bg-[#0f0a08]`}>
        <NetworkStatusIndicator />
        <ErrorBoundary>
          <AuthWrapper>{children}</AuthWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
