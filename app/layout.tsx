import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barista Mate | העוזר האישי לקפה",
  description: "Smart Dial-In Assistant & People & Orders Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-hebrew min-h-screen text-[#EAE0D5] bg-[#0f0a08]`}>
        {children}
      </body>
    </html>
  );
}
