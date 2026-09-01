import { ChevronDown } from "lucide-react";

const FAQS = [
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

export function HelpFaq() {
  return (
    <div className="flex flex-col gap-2">
      {FAQS.map((item) => (
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
