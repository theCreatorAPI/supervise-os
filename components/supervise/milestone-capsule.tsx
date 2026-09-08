import { Check, Clock3, Lock } from "lucide-react";

/**
 * The reference's tall pill-masked photograph, rebuilt around this product's own
 * subject: a project's milestone journey read bottom-to-top inside a capsule.
 */

const MILESTONES = [
  { name: "Defense", state: "locked" },
  { name: "Results", state: "locked" },
  { name: "Methodology", state: "active" },
  { name: "Chapter 2", state: "done" },
  { name: "Proposal", state: "done" },
  { name: "Topic approval", state: "done" },
] as const;

const NODE = {
  done: { icon: Check, ring: "border-white/70 bg-white text-brand-700" },
  active: { icon: Clock3, ring: "border-white bg-white/15 text-white" },
  locked: { icon: Lock, ring: "border-white/25 bg-white/5 text-white/50" },
};

export function MilestoneCapsule() {
  return (
    <div className="relative mx-auto w-76">
      {/* Tall stadium: height must far exceed width, or rounded-full reads as an ellipse */}
      <div className="relative flex h-[34rem] flex-col justify-center overflow-hidden rounded-full bg-linear-to-b from-[#8aa653] via-brand-500 to-brand-700 px-9">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] bg-size-[20px_20px] opacity-[0.12]"
        />
        <div aria-hidden className="absolute -right-16 top-10 size-56 rounded-full bg-white/20 blur-[70px]" />

        {/* Spine connecting the nodes */}
        <div aria-hidden className="absolute bottom-28 left-[3.55rem] top-28 w-px bg-white/25" />

        <ol className="relative z-10 flex flex-col gap-6">
          {MILESTONES.map((m) => {
            const node = NODE[m.state];
            const Icon = node.icon;
            return (
              <li key={m.name} className="flex items-center gap-4">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${node.ring}`}
                >
                  <Icon className="size-4" />
                </span>
                <span
                  className={
                    m.state === "locked"
                      ? "text-sm text-white/50"
                      : "text-sm font-medium text-white"
                  }
                >
                  {m.name}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Floating readouts, as in the reference */}
      <div className="absolute -right-6 top-28 flex items-center gap-2.5 rounded-full bg-white py-2 pl-4 pr-2 shadow-[0_10px_30px_-10px_rgba(16,24,40,0.35)] sm:-right-12">
        <span className="whitespace-nowrap text-[13px] font-medium">3 of 6 approved</span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-white">
          <Check className="size-3.5" />
        </span>
      </div>

      <div className="absolute -left-6 bottom-12 flex items-center gap-2.5 rounded-full bg-white py-2 pl-4 pr-2 shadow-[0_10px_30px_-10px_rgba(16,24,40,0.35)] sm:-left-14">
        <span className="whitespace-nowrap text-[13px] font-medium">92% on track</span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Clock3 className="size-3.5" />
        </span>
      </div>
    </div>
  );
}
