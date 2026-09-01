"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Radar, ArrowRight, Radio, Gauge, Bell, GitBranch, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { ScrollReveal } from "@/components/supervise/scroll-reveal";
import { MobileNavDrawer } from "@/components/supervise/mobile-nav-drawer";
import { DashboardMockup } from "@/components/supervise/mockups/dashboard-mockup";
import { ReviewMockup } from "@/components/supervise/mockups/review-mockup";
import { WorkloadMockup } from "@/components/supervise/mockups/workload-mockup";
import { AtRiskMockup } from "@/components/supervise/mockups/at-risk-mockup";
import { Footer } from "@/components/supervise/footer";
import { CheckCircle2 } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Analytics", href: "#analytics" },
  { label: "Testimonials", href: "#testimonials" },
];

const FEATURES = [
  {
    icon: GitBranch,
    title: "Progress Constellation",
    body: "Milestones rendered as a living, glowing timeline — not a boring progress bar. See exactly where every project stands, at a glance.",
  },
  {
    icon: Radio,
    title: "At-risk detection, live",
    body: "Stale submissions, repeated returns, overdue reviews, missed meetings — flagged automatically the moment a project drifts off track.",
  },
  {
    icon: Gauge,
    title: "Workload you can actually see",
    body: "Radial capacity rings per lecturer, color-coded by load. No more guessing who's buried and who has room.",
  },
  {
    icon: Bell,
    title: "Notifications that matter",
    body: "New submissions, reviews, milestone approvals, meeting reminders — delivered the moment they happen.",
  },
];

const STEPS = [
  {
    title: "Submit",
    body: "Students drag and drop each milestone's document, versioned automatically.",
  },
  {
    title: "Review",
    body: "Lecturers preview, approve, return, or comment — the milestone status updates instantly.",
  },
  {
    title: "Track",
    body: "Every project's health is visible in real time, for the student, the lecturer, and the department.",
  },
];

const STATS = [
  { label: "Students tracked", value: 64 },
  { label: "Avg. review turnaround", value: 3, suffix: "d" },
  { label: "At-risk caught early", value: 92, suffix: "%" },
];

export function LandingPage({
  dashboardHref,
  userName,
}: {
  dashboardHref: string | null;
  userName: string | null;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-500">
              <Radar className="size-4.5 text-white" />
            </div>
            <span className="font-display text-lg font-bold">Supervise OS</span>
          </div>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {dashboardHref ? (
              <Button asChild>
                <Link href={dashboardHref}>
                  {userName ? `Continue as ${userName.split(" ")[0]}` : "Dashboard"} <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}
          </div>

          <MobileNavDrawer links={NAV_LINKS} dashboardHref={dashboardHref} userName={userName} />
        </nav>
      </header>

      {/* Section 1 — Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-16 md:grid-cols-2 md:gap-8 md:pt-28">
        <div className="min-w-0 md:pr-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600"
          >
            Academic project supervision
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-6xl font-bold leading-[0.98] tracking-tight md:text-7xl"
          >
            Project supervision,
            <br />
            <span className="text-gradient">under control.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 max-w-md text-lg text-muted-foreground"
          >
            Milestones, submissions, reviews, and risk — tracked in one live command center for
            students and lecturers. No spreadsheets. No missed chapters.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button size="lg" asChild>
              <Link href={dashboardHref ?? "/sign-up"}>
                {dashboardHref ? "Go to your dashboard" : "Start free"} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-in">I already have an account</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="relative min-w-0 md:translate-y-6"
        >
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 hidden rounded-[2rem] bg-gradient-to-br from-brand-100 via-brand-50 to-white opacity-70 blur-2xl md:block"
          />
          <DashboardMockup />
        </motion.div>
      </section>

      {/* Stats ledger */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <ScrollReveal direction="up">
          <div className="flex flex-col divide-y divide-border border-y border-border sm:flex-row sm:divide-x sm:divide-y-0">
            {STATS.map((s) => (
              <div key={s.label} className="flex-1 py-6 text-center first:pt-0 last:pb-0 sm:px-8 sm:py-2 sm:text-left first:sm:pl-0 last:sm:pr-0">
                <p className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  <CountUp value={s.value} />
                  {s.suffix}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Section 2 — Features */}
      <section id="features" className="mx-auto max-w-5xl scroll-mt-20 px-6 pb-24">
        <ScrollReveal direction="up">
          <div className="mb-14 max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">What&apos;s inside</p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Everything supervision needs, live</h2>
            <p className="mt-3 text-muted-foreground">
              Four systems working together so nothing falls through the cracks between proposal and defense.
            </p>
          </div>
        </ScrollReveal>
        <div className="border-t border-border">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} direction="up" delay={i * 0.05}>
              <div className="group grid grid-cols-1 gap-4 border-b border-border py-8 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start md:gap-10">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <f.icon className="size-4.5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground md:max-w-lg md:text-base">{f.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Section 3 — How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-background-elevated py-24">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal direction="up">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">The cycle</p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">How it works</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Three steps, repeated for every milestone, from topic approval to defense.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <div className="mx-auto mb-16 max-w-md">
              <ReviewMockup />
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.05}>
            <div className="relative flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-6">
              <div aria-hidden className="absolute left-0 right-0 top-5 hidden h-px bg-border-strong md:block" />
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative flex gap-4 md:min-w-0 md:flex-1 md:flex-col md:items-start">
                  <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-500 bg-background-elevated font-display text-sm font-bold text-brand-600 md:mb-5">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground md:max-w-[220px]">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 4 — Analytics */}
      <section id="analytics" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <ScrollReveal direction="left">
            <WorkloadMockup />
          </ScrollReveal>
          <ScrollReveal direction="right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">The full picture</p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
              Workload you can actually <span className="text-gradient">see</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Radial capacity rings per lecturer, a live completion funnel, and department-wide
              at-risk percentages — all computed from real submission and review data, not a
              spreadsheet someone forgot to update.
            </p>
            <div className="mt-6 flex items-center gap-2.5 border-t border-border pt-5">
              <span className="size-2 shrink-0 rounded-full bg-brand-500" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Dr. Amara&apos;s workload</span> — 18 of 25 capacity · 3 at risk
              </p>
            </div>
            <Button size="lg" className="mt-6" asChild>
              <Link href={dashboardHref ?? "/sign-up"}>
                See it in action <ArrowRight className="size-4" />
              </Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 5 — Testimonial */}
      <section id="testimonials" className="scroll-mt-20 bg-background-elevated py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          <ScrollReveal direction="left">
            <AtRiskMockup />
          </ScrollReveal>
          <ScrollReveal direction="right">
            <Quote className="size-8 text-brand-300" />
            <p className="mt-4 font-display text-2xl font-medium leading-snug">
              &ldquo;I used to find out a student was behind three weeks too late. Now the at-risk
              panel tells me the moment it happens — with the exact reason.&rdquo;
            </p>
            <p className="mt-5 text-sm font-semibold text-foreground">Dr. Amara Chen</p>
            <p className="text-sm text-muted-foreground">Senior Lecturer, Computer Science</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 6 — Final CTA */}
      <section className="mx-auto max-w-5xl px-6 py-28">
        <ScrollReveal direction="up">
          <div className="glass-strong flex flex-col items-center gap-8 rounded-3xl p-10 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-6">
              <div className="hidden size-20 shrink-0 items-center justify-center rounded-full bg-success-500/10 text-success-600 md:flex">
                <CheckCircle2 className="size-10" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold md:text-3xl">Ready to see every project, clearly?</h2>
                <p className="mt-2 text-muted-foreground">
                  Set up takes minutes. Your first at-risk alert could save a whole semester.
                </p>
              </div>
            </div>
            <Button size="lg" asChild>
              <Link href={dashboardHref ?? "/sign-up"}>
                {dashboardHref ? "Go to your dashboard" : "Start free"} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
