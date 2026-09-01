"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Radar, ArrowRight, Sparkles, Radio, Gauge, Bell, GitBranch, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { ScrollReveal } from "@/components/supervise/scroll-reveal";
import { MobileNavDrawer } from "@/components/supervise/mobile-nav-drawer";
import { HeroIllustration } from "@/components/supervise/illustrations/hero-illustration";
import { WorkflowIllustration } from "@/components/supervise/illustrations/workflow-illustration";
import { AnalyticsIllustration } from "@/components/supervise/illustrations/analytics-illustration";
import { MentorshipIllustration } from "@/components/supervise/illustrations/mentorship-illustration";
import { CompletionIllustration } from "@/components/supervise/illustrations/completion-illustration";
import { Footer } from "@/components/supervise/footer";

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
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-16 md:grid-cols-2 md:pt-24">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-background-elevated px-3.5 py-1.5 text-xs text-brand-700"
          >
            <Sparkles className="size-3.5" /> Now piloting in Computer Science
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl"
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
          className="glass rounded-3xl p-6"
        >
          <HeroIllustration />
        </motion.div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <ScrollReveal key={s.label} direction="up" delay={i * 0.08}>
              <div className="glass rounded-2xl p-6 text-center">
                <p className="font-display text-4xl font-bold text-foreground">
                  <CountUp value={s.value} />
                  {s.suffix}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Section 2 — Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
        <ScrollReveal direction="up">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Everything supervision needs, live</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Four systems working together so nothing falls through the cracks between proposal and defense.
            </p>
          </div>
        </ScrollReveal>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} direction={i % 2 === 0 ? "left" : "right"} delay={i * 0.06}>
              <div className="glass group h-full rounded-2xl p-7 transition-transform hover:-translate-y-1">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
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
              <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Three steps, repeated for every milestone, from topic approval to defense.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <div className="mx-auto mb-10 max-w-2xl">
              <WorkflowIllustration />
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.title} direction={i % 2 === 0 ? "left" : "right"} delay={i * 0.08}>
                <div className="text-center md:text-left">
                  <span className="font-display text-sm font-bold text-brand-600">0{i + 1}</span>
                  <h3 className="mt-1 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Analytics */}
      <section id="analytics" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <ScrollReveal direction="left">
            <div className="glass rounded-3xl p-6">
              <AnalyticsIllustration />
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Workload you can actually <span className="text-gradient">see</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Radial capacity rings per lecturer, a live completion funnel, and department-wide
              at-risk percentages — all computed from real submission and review data, not a
              spreadsheet someone forgot to update.
            </p>
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border-strong bg-white p-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Gauge className="size-5" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">Dr. Amara&apos;s workload</p>
                <p className="text-sm text-muted-foreground">18 of 25 capacity · 3 at risk</p>
              </div>
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
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-2">
          <ScrollReveal direction="left">
            <div className="glass rounded-3xl p-8">
              <MentorshipIllustration />
            </div>
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
              <div className="hidden size-28 shrink-0 md:block">
                <CompletionIllustration />
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
