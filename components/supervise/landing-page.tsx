"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Radar, ArrowRight, ArrowDown, ArrowUpRight, Radio, Gauge, Bell, GitBranch, Quote, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { ScrollReveal } from "@/components/supervise/scroll-reveal";
import { MobileNavDrawer } from "@/components/supervise/mobile-nav-drawer";
import { AtRiskMockup } from "@/components/supervise/mockups/at-risk-mockup";
import { Footer } from "@/components/supervise/footer";
import { HeroBackdrop } from "@/components/supervise/hero-backdrop";
import { MilestoneCapsule } from "@/components/supervise/milestone-capsule";
import { FeatureOrb } from "@/components/supervise/feature-orb";
import { ShowcaseCarousel } from "@/components/supervise/showcase-carousel";
import { CheckCircle2 } from "lucide-react";
import { cn, firstName } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Analytics", href: "#analytics" },
  { label: "Testimonials", href: "#testimonials" },
];

/** The same links, split into the two nav capsules the hero design uses. */
const NAV_PILLS = [NAV_LINKS.slice(0, 2), NAV_LINKS.slice(2)];

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

/** The numbered column beside the capsule visual. */
const INSIGHTS = [
  {
    title: "Risk you can see coming",
    body: "Stale submissions, repeated returns, overdue reviews and missed meetings are flagged the moment they happen — with the exact reason attached.",
  },
  {
    title: "Milestones end to end",
    body: "Every submission, review and approval is versioned and visible, from topic approval through to defense day.",
  },
  {
    title: "Load shared fairly",
    body: "Capacity per supervisor at a glance, so nobody quietly ends up carrying twice the projects of the person beside them.",
  },
];

const STATS = [
  { label: "Students tracked", value: 64 },
  { label: "Avg. review turnaround", value: 3, suffix: "d" },
  { label: "At-risk caught early", value: 92, suffix: "%" },
];

/* Harmonograph figure for the hero panel — overlapping curves whose envelope
   converges at both ends, matching the interference pattern in the reference. */
const WAVE_W = 300;
const WAVE_H = 120;
const WAVE_CURVES = 5;

function wavePoint(curve: number, t: number) {
  const freq = 1.5 + curve * 0.6;
  const phase = (curve * Math.PI) / 2.6;
  const envelope = Math.pow(Math.sin(Math.PI * t), 0.85);
  return {
    x: t * WAVE_W,
    y: WAVE_H / 2 + Math.sin(t * Math.PI * 2 * freq + phase) * WAVE_H * 0.44 * envelope,
  };
}

const WAVE_PATHS = Array.from({ length: WAVE_CURVES }, (_, curve) => {
  let d = "";
  for (let step = 0; step <= 72; step += 1) {
    const { x, y } = wavePoint(curve, step / 72);
    d += `${step === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
});

const WAVE_DOTS = [
  wavePoint(0, 0.17),
  wavePoint(2, 0.33),
  wavePoint(1, 0.5),
  wavePoint(3, 0.62),
  wavePoint(0, 0.78),
  wavePoint(2, 0.9),
];

export function LandingPage({
  dashboardHref,
  userName,
}: {
  dashboardHref: string | null;
  userName: string | null;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="font-hero relative min-h-screen overflow-x-hidden">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-colors duration-300",
          scrolled ? "border-b border-border bg-white/80 backdrop-blur-md" : "border-b border-transparent bg-transparent"
        )}
      >
        <nav
          className="mx-auto flex max-w-344 items-center justify-between gap-4 px-6 py-4"
        >
          <div className="flex items-center gap-5">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <Radar className={cn("size-5 transition-colors", scrolled ? "text-brand-600" : "text-white")} />
              <span className={cn("text-lg font-medium transition-colors", scrolled ? "text-foreground" : "text-white")}>
                Supervise OS
              </span>
            </Link>

            {/* Two link pills, echoing the reference's paired nav capsules */}
            <div className="hidden items-center gap-1.5 lg:flex">
              {NAV_PILLS.map((pill) => (
                <div
                  key={pill[0].href}
                  className={cn(
                    "flex items-center rounded-full px-1.5 py-1.5 backdrop-blur-md transition-colors",
                    scrolled ? "bg-black/5" : "bg-white/10"
                  )}
                >
                  {pill.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                        scrolled
                          ? "text-muted-foreground hover:bg-white hover:text-foreground"
                          : "text-white/85 hover:bg-white/15 hover:text-white"
                      )}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Four product pillars, as a compact icon index into the features section */}
            <div className="hidden items-center gap-1.5 lg:flex">
              {FEATURES.map((f) => (
                <a
                  key={f.title}
                  href="#features"
                  title={f.title}
                  aria-label={f.title}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-colors",
                    scrolled
                      ? "bg-black/5 text-muted-foreground hover:text-foreground"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  )}
                >
                  <f.icon className="size-4" />
                </a>
              ))}
            </div>

            {dashboardHref ? (
              <Button
                className={cn(
                  "hidden font-medium md:inline-flex",
                  !scrolled && "bg-white text-brand-700 hover:bg-brand-50"
                )}
                asChild
              >
                <Link href={dashboardHref}>
                  {userName ? `Continue as ${firstName(userName)}` : "Dashboard"} <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className={cn("hidden font-medium sm:inline-flex", !scrolled && "text-white hover:bg-white/10")}
                  asChild
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button
                  className={cn("hidden font-medium md:inline-flex", !scrolled && "bg-white text-brand-700 hover:bg-brand-50")}
                  asChild
                >
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}

            <MobileNavDrawer links={NAV_LINKS} dashboardHref={dashboardHref} userName={userName} />
          </div>
        </nav>
      </header>

      {/* Section 1 — Hero */}
      <section className="relative min-h-screen overflow-hidden bg-[#0b1206]">
        <HeroBackdrop />

        {/* Layout rules, as in the reference */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[17%] hidden w-px bg-white/[0.08] lg:block" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[17%] hidden w-px bg-white/[0.08] lg:block" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[26%] hidden h-px bg-white/[0.08] lg:block" />

        <div className="relative mx-auto flex min-h-screen max-w-344 flex-col px-6 pb-8 pt-26 lg:px-12 lg:pt-28">
          <div className="grid flex-1 grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left — headline and supporting copy */}
            <div className="flex flex-col justify-center lg:col-span-7 lg:col-start-2">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-[3rem] font-light leading-[1.04] tracking-[-0.02em] text-white sm:text-[3.5rem] lg:text-[4.25rem]"
              >
                Project supervision,
                <br />
                under control.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="mt-8 max-w-xl text-lg leading-relaxed text-white/70 lg:mt-10 lg:text-xl"
              >
                Every milestone, submission and review for every student, in one live view — so a
                project that starts slipping shows up this week, not at the defense.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
              >
                <span className="flex items-center gap-2.5 text-[15px] text-white/70">
                  <Radio className="size-4 shrink-0 text-white/90" /> Risk flagged automatically
                </span>
                <span className="flex items-center gap-2.5 text-[15px] text-white/70">
                  <GitBranch className="size-4 shrink-0 text-white/90" /> Milestones tracked end to end
                </span>
                <span className="flex items-center gap-2.5 text-[15px] text-white/70">
                  <Gauge className="size-4 shrink-0 text-white/90" /> Supervisor load in view
                </span>
              </motion.div>
            </div>

            {/* Right — the tall stat panel */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="hidden rounded-4xl bg-black/35 p-8 backdrop-blur-xl lg:col-span-4 lg:block"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}
            >
              <p className="text-[15px] text-white/85">Milestone progress</p>

              <div className="mt-8 flex items-end justify-between gap-4">
                <p className="text-[3.5rem] font-light leading-none text-white">
                  3<span className="ml-0.5 text-2xl text-white/80">/6</span>
                </p>
                <span className="mb-2 flex items-center gap-1.5 text-[15px] text-white/85">
                  <TrendingUp className="size-4" /> On track
                </span>
              </div>

              <svg
                viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
                fill="none"
                className="mt-10 w-full"
                aria-hidden
                preserveAspectRatio="none"
              >
                {WAVE_PATHS.map((d, i) => (
                  <path key={i} d={d} stroke="white" strokeWidth={0.9} opacity={0.28 + i * 0.12} />
                ))}
                {WAVE_DOTS.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={2.6} fill="white" />
                ))}
              </svg>

              <div className="mt-8 flex items-center justify-between text-sm text-white/55">
                <span>0</span>
                <span>6 milestones</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom row — three zones, as in the reference */}
          <div className="mt-auto grid grid-cols-1 items-end gap-8 pt-10 sm:grid-cols-3">
            <div className="flex flex-col items-start gap-3 sm:items-center sm:text-center">
              <div className="flex -space-x-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-brand-300 text-xs font-medium text-brand-700 ring-2 ring-white/70">
                  AC
                </span>
                <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700 ring-2 ring-white/70">
                  JO
                </span>
              </div>
              <p className="text-[13px] leading-snug text-white/75 sm:max-w-40">
                Supervising real projects in department pilots, this term.
              </p>
            </div>

            <Link href={dashboardHref ?? "/sign-up"} className="group flex items-center gap-4 sm:justify-center">
              <span className="text-[13px] leading-snug text-white/85">
                See your first
                <br />
                at-risk alert
              </span>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-brand-700">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>

            <a href="#features" className="flex flex-col items-start gap-3 sm:items-center">
              <span className="text-[13px] text-white/85">Scroll down</span>
              <ArrowDown className="size-5 animate-bounce text-white/85" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 2 — Insight: capsule visual beside a numbered list */}
      <section id="analytics" className="scroll-mt-24 bg-background py-24 lg:py-32">
        <div className="mx-auto grid max-w-344 grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:gap-24 lg:px-12">
          <ScrollReveal direction="left">
            <MilestoneCapsule />
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="flex flex-col gap-10">
              {INSIGHTS.map((item, i) => (
                <div key={item.title} className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-10">
                  <div>
                    <p className="text-xs tracking-[0.14em] text-muted-foreground">
                      [ {String(i + 1).padStart(2, "0")} ]
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-14 max-w-md text-[13px] leading-relaxed text-muted-foreground">
              Built around how supervision actually runs, so the work stays visible without anyone
              chasing status over email.
            </p>

            <Button
              variant="secondary"
              size="lg"
              className="mt-6 rounded-full border-transparent bg-foreground text-white hover:bg-foreground/90"
              asChild
            >
              <Link href={dashboardHref ?? "/sign-up"}>
                {dashboardHref ? "Go to your dashboard" : "Explore Supervise OS"}
              </Link>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 3 — Capability cards */}
      <section id="features" className="scroll-mt-24 bg-background-elevated py-24 lg:py-32">
        <div className="mx-auto max-w-344 px-6 lg:px-12">
          <ScrollReveal direction="up">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <h2 className="max-w-3xl text-3xl font-medium leading-snug tracking-[-0.01em] sm:text-4xl lg:text-[2.75rem]">
                Supervise OS is a single live view of every final-year project{" "}
                <span className="text-muted-foreground/55">
                  for the student writing it, the lecturer reviewing it, and the department
                  accountable for it.
                </span>
              </h2>

              <a href="#how-it-works" className="group flex items-center gap-3 lg:flex-col lg:items-start lg:gap-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <GitBranch className="size-4" />
                </span>
                <span className="flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium">
                  How it works
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </div>
          </ScrollReveal>

          <div className="mt-20 grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} direction="up" delay={i * 0.06}>
                <div className="group">
                  <div className="relative w-fit">
                    <FeatureOrb seed={i + 1} icon={f.icon} />
                    <a
                      href="#how-it-works"
                      aria-label={`How ${f.title} works`}
                      className="absolute -right-1 top-1 flex size-9 items-center justify-center rounded-full border border-border-strong bg-white text-foreground transition-colors group-hover:bg-foreground group-hover:text-white"
                    >
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>
                  <h3 className="mt-6 text-[15px] font-semibold">{f.title}</h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — The supervision cycle, as a showcase carousel */}
      <section id="how-it-works" className="scroll-mt-24 bg-background py-24 lg:py-32">
        <div className="mx-auto max-w-344 px-6 lg:px-12">
          <ScrollReveal direction="up">
            <div className="mb-12 max-w-2xl">
              <p className="text-xs tracking-[0.14em] text-muted-foreground">[ THE CYCLE ]</p>
              <h2 className="mt-4 text-3xl font-medium leading-snug tracking-[-0.01em] sm:text-4xl">
                Three steps, repeated for every milestone, from topic approval to defense.
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.08}>
            <ShowcaseCarousel />
          </ScrollReveal>
        </div>
      </section>

      {/* Section 5 — Testimonial and the numbers behind it */}
      <section id="testimonials" className="scroll-mt-24 bg-background-elevated py-24 lg:py-32">
        <div className="mx-auto max-w-344 px-6 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-24">
            <ScrollReveal direction="left">
              <AtRiskMockup />
            </ScrollReveal>
            <ScrollReveal direction="right">
              <Quote className="size-7 text-brand-300" />
              <p className="mt-5 text-2xl font-medium leading-snug tracking-[-0.01em] sm:text-[1.75rem]">
                &ldquo;I used to find out a student was behind three weeks too late. Now the at-risk
                panel tells me the moment it happens — with the exact reason.&rdquo;
              </p>
              <p className="mt-6 text-sm font-semibold text-foreground">Dr. Amara Chen</p>
              <p className="text-sm text-muted-foreground">Senior Lecturer, Computer Science</p>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="up" delay={0.05}>
            <div className="mt-20 grid grid-cols-1 gap-y-10 border-t border-border-strong pt-12 sm:grid-cols-3 sm:gap-x-10">
              {STATS.map((s, i) => (
                <div key={s.label}>
                  <p className="text-xs tracking-[0.14em] text-muted-foreground">
                    [ {String(i + 1).padStart(2, "0")} ]
                  </p>
                  <p className="mt-3 text-4xl font-light sm:text-5xl">
                    <CountUp value={s.value} />
                    {s.suffix}
                  </p>
                  <p className="mt-2 text-[13px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 6 — Final CTA */}
      <section className="bg-background py-24 lg:py-32">
        <div className="mx-auto max-w-344 px-6 lg:px-12">
          <ScrollReveal direction="up">
            <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#8aa653] via-brand-500 to-brand-700 px-8 py-16 sm:px-14 lg:py-20">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] bg-size-[22px_22px] opacity-[0.10]"
              />
              <div aria-hidden className="absolute -right-20 -top-24 size-96 rounded-full bg-white/20 blur-[110px]" />

              <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl">
                  <span className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <h2 className="mt-6 text-3xl font-medium leading-snug tracking-[-0.01em] text-white sm:text-4xl">
                    Ready to see every project, clearly?
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                    Set up takes minutes. Your first at-risk alert could save a whole semester.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  className="shrink-0 rounded-full border-transparent bg-white text-brand-700 hover:bg-brand-50"
                  asChild
                >
                  <Link href={dashboardHref ?? "/sign-up"}>
                    {dashboardHref ? "Go to your dashboard" : "Start free"}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
