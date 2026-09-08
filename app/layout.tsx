import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Supervise OS — Project Supervision, Under Control",
  description:
    "The academic command center for student-lecturer project supervision: milestones, submissions, risk detection, and workload — all in one live view.",
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
