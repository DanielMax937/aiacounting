import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";


export const metadata: Metadata = {
  metadataBase: new URL("https://free-accounting.vercel.app"),
  title: {
    default: "Free Accounting - AI Expense Tracker",
    template: "%s | Free Accounting",
  },
  description:
    "Free Accounting is a mobile-first AI accounting app for tracking expenses, income, tags, and personal finance trends.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Free Accounting - AI Expense Tracker",
    description:
      "Track expenses, income, and personal finance trends with a simple AI-assisted accounting workspace.",
    url: "https://free-accounting.vercel.app/",
    siteName: "Free Accounting",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      {process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN ? (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({
              token: process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
            })}
            strategy="afterInteractive"
          />
        ) : null}
</body>
    </html>
  );
}
