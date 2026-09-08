import Link from "next/link";
import { Radar } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Analytics", href: "#analytics" },
  { label: "Testimonials", href: "#testimonials" },
];

const ACCOUNT_LINKS = [
  { label: "Sign in", href: "/sign-in" },
  { label: "Register as a lecturer", href: "/sign-up" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background-elevated">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-500">
              <Radar className="size-4.5 text-white" />
            </div>
            <span className="font-display text-lg font-bold">Supervise OS</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            The academic command center for student-lecturer project supervision — milestones,
            submissions, reviews, and risk, tracked live, for every role in the department.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="-my-1 inline-block py-1.5 text-sm text-foreground/80 transition-colors hover:text-brand-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="-my-1 inline-block py-1.5 text-sm text-foreground/80 transition-colors hover:text-brand-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Supervise OS. All rights reserved.</p>
          <p>Built for departments who&apos;d rather catch problems in week 3, not week 13.</p>
        </div>
      </div>
    </footer>
  );
}
