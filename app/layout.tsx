import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/auth-wrapper";
import { AuthProvider } from "@/lib/auth-context";
import ErrorBoundary from "@/components/error-boundary";
import { NetworkStatusIndicator } from "@/components/network-status-indicator";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barista Mate | העוזר האישי לבריסטה הביתי — כיול אספרסו, ספריית פולים ותחזוקה",
  description: "הכלי האולטימטיבי לבריסטה הביתי: מחשבון כיול חכם לטחינה וזמן חילוץ, ניהול ספריית פולי קפה מומלצים, והתראות תחזוקה למכונת האספרסו.",
  keywords: [
    "אספרסו ביתי",
    "כיול אספרסו",
    "כיול טחינה",
    "פולי קפה",
    "בתי קלייה בישראל",
    "תחזוקת מכונת אספרסו",
    "Barista Mate",
  ],
  metadataBase: new URL('https://barista-mate.vercel.app'),
  openGraph: {
    title: "Barista Mate — העוזר האישי לבריסטה הביתי",
    description: "מחשבון כיול חכם, ספריית פולי קפה אישית עם המלצות קהילה, ומעקב תחזוקה למכונת האספרסו עם התראות לנייד.",
    url: "https://barista-mate.vercel.app",
    siteName: "Barista Mate",
    locale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: "summary_large_image",
    title: "Barista Mate — העוזר האישי לבריסטה הביתי",
    description: "מחשבון כיול חכם, ספריית פולי קפה אישית עם המלצות קהילה, ומעקב תחזוקה למכונת האספרסו.",
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f0a08",
  viewportFit: 'cover',
};

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
          <AuthProvider>
            <AuthWrapper>{children}</AuthWrapper>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
