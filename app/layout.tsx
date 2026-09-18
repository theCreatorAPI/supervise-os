import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

// Geometric sans used only across the marketing hero — Fraunces stays the
// brand's display serif everywhere else (h1/h2 across the app). Light weights
// carry the oversized headline and the hero panel numerals.
const manrope = Manrope({
  variable: "--font-hero",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const TITLE = "Supervise OS — Project Supervision, Under Control";
const DESCRIPTION =
  "The academic command center for student–lecturer project supervision: milestones, submissions, reviews, risk detection and supervisor workload, all in one live view.";

/**
 * Canonical origin for absolute URLs in OG/Twitter tags and the sitemap.
 *
 * Social crawlers reject relative image URLs, so `metadataBase` has to resolve
 * to a real origin. It comes from the deploy environment, falling back to
 * localhost so a dev build doesn't emit links to a domain that isn't ours.
 */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: TITLE,
    // Inner pages set only their own name; this appends the product.
    template: "%s · Supervise OS",
  },
  description: DESCRIPTION,
  applicationName: "Supervise OS",
  keywords: [
    "project supervision",
    "final year project",
    "academic supervision software",
    "student milestone tracking",
    "dissertation supervision",
    "university project management",
  ],
  authors: [{ name: "Supervise OS" }],
  creator: "Supervise OS",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Supervise OS",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Left zoomable on purpose: capping it locks out anyone who needs to magnify.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1206" },
  ],
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#ffffff",
                border: "1px solid #d9d4c4",
                color: "#292d32",
                boxShadow: "0 4px 16px -4px rgba(16,24,40,0.15)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
