import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Truth N Dare — Spin. Confess. Survive.",
  description: "AI-generated chaos for friends. Multiplayer party game with bottle spin.",
  keywords: ["truth or dare", "party game", "multiplayer", "AI game", "spin the bottle"],
  openGraph: {
    title: "Truth N Dare",
    description: "AI-generated chaos for friends.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {adsenseId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="noise min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
