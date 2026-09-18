import { ChevronDown } from "lucide-react";

export type Faq = { q: string; a: string };

/** What supervisors ask. Their questions are about running the review loop, not about being reviewed. */
export const LECTURER_FAQS: Faq[] = [
  {
    q: "How do I add a student?",
    a: "From My Students, use Add student. You'll get an activation link to share with them — they set their own password, and you're already recorded as their supervisor.",
  },
  {
    q: "What do the review decisions do?",
    a: "Approving marks the milestone complete and moves the project on. Requesting corrections returns the submission to the student, who can resubmit — the new version is kept alongside the old one rather than replacing it.",
  },
  {
    q: "When does a project get flagged at risk?",
    a: "Automatically, from four triggers: no submission in 21 days, a review left open 21 days, a milestone past its due date, or a missed meeting. One active trigger reads At Risk; two or more, or any single one open 35+ days, reads Critical.",
  },
  {
    q: "Why can't I see another lecturer's students?",
    a: "Supervision is scoped to you. Every student page checks that you're the supervising lecturer before it loads. Department-wide views belong to the management role.",
  },
  {
    q: "Can I turn off notifications?",
    a: "Yes — Settings has separate toggles for project updates and meeting reminders. Activity still appears on your dashboard either way.",
  },
];

const FAQS: Faq[] = [
  {
    q: "How do I get a supervisor assigned?",
    a: "Your lecturer adds you as a student and sends you an activation link. Once you activate your account, that lecturer is already your supervisor — no extra step needed.",
  },
  {
    q: "How many topics can I propose?",
    a: "Up to three at a time, from the Project Approval page. Pending topics can be deleted if you change your mind; once one is approved, your project is created automatically.",
  },
  {
    q: "What file types can I submit?",
    a: "PDF, DOC, and DOCX, up to 25MB per file. Every submission is versioned, so resubmitting after a return keeps the full history.",
  },
  {
    q: "What does each risk status mean?",
    a: "Normal means everything's on track. At Risk means one issue was flagged (like a stale submission or a missed meeting). Critical means two or more issues, or one that's been open 35+ days.",
  },
  {
    q: "Can I turn off notifications?",
    a: "Yes — go to Settings and toggle in-app notifications off. You'll still see everything in your Activity log and on Submissions.",
  },
];

/** Defaults to the student set so existing callers keep working unchanged. */
export function HelpFaq({ items = FAQS }: { items?: Faq[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <details key={item.q} className="group rounded-xl border border-border-strong bg-white px-4 py-3 open:pb-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
            {item.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
