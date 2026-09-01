import Link from "next/link";
import { Radar, Sparkles } from "lucide-react";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-background-elevated p-10 lg:flex">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-100 blur-[100px]" />

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-500">
            <Radar className="size-4.5 text-white" />
          </div>
          <span className="font-display text-lg font-bold">Supervise OS</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-white px-3 py-1 text-xs text-brand-700">
            <Sparkles className="size-3" /> Academic command center
          </div>
          <h2 className="font-display text-4xl font-bold leading-[1.1] text-foreground">
            Every project. Every milestone. Zero surprises.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Supervise OS tracks submissions, feedback, and risk in real time — so nothing slips
            through the cracks between now and defense day.
          </p>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Supervise OS — built for department pilots.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-500">
              <Radar className="size-4 text-white" />
            </div>
            <span className="font-display text-base font-bold">Supervise OS</span>
          </div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
