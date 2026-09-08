import Link from "next/link";
import { Radar } from "lucide-react";
import { AuthShowcase } from "@/components/supervise/auth-showcase";

export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  /** The bottom bar: a question plus its counterpart link. */
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="font-hero grid min-h-screen w-full bg-background-elevated lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Left — the form */}
      <div className="relative flex flex-col px-6 py-8 lg:px-14 lg:py-10">
        {/* Faint angular watermark, as in the reference */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(41,45,50,0.045) 0px, rgba(41,45,50,0.045) 1px, transparent 1px, transparent 90px), repeating-linear-gradient(-45deg, rgba(41,45,50,0.045) 0px, rgba(41,45,50,0.045) 1px, transparent 1px, transparent 90px)",
          }}
        />

        <div className="relative z-10 flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <Link
                href="/"
                aria-label="Supervise OS home"
                className="flex size-12 items-center justify-center rounded-2xl bg-brand-500 shadow-[0_6px_16px_-6px_rgba(79,95,49,0.7)] transition-transform hover:scale-105"
              >
                <Radar className="size-5 text-white" />
              </Link>
              <h1 className="mt-5 text-xl font-bold">{title}</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 text-[13px] text-muted-foreground">
          {footer}
        </div>
      </div>

      {/* Right — the marketing showcase */}
      <div className="hidden p-3 lg:block">
        <AuthShowcase />
      </div>
    </div>
  );
}
