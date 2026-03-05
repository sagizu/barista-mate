import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/auth-wrapper";
import ErrorBoundary from "@/components/error-boundary";
import { NetworkStatusIndicator } from "@/components/network-status-indicator";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barista Mate",
  description: "The ultimate tool for home baristas: track beans, dial-ins and manage espresso machine maintenance.",
  metadataBase: new URL('https://barista-mate.vercel.app'),
  openGraph: {
    title: "Barista Mate",
    description: "The ultimate tool for home baristas: track beans, dial-ins and manage espresso machine maintenance.",
    url: "https://barista-mate.vercel.app",
    siteName: "Barista Mate",
    images: [
      {
        url: '/icon.svg',
        width: 800,
        height: 800,
        alt: 'Barista Mate Logo',
      },
    ],
    locale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: "summary",
    title: "Barista Mate",
    description: "The ultimate tool for home baristas: track beans, dial-ins and manage espresso machine maintenance.",
    images: ['/icon.svg'],
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
          <AuthWrapper>{children}</AuthWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
