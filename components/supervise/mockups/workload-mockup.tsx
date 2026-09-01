import { BrowserFrame } from "@/components/supervise/browser-frame";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Users } from "lucide-react";

const LECTURERS = [
  { name: "Ifeoma Okafor", students: 24, capacity: 20 },
  { name: "Amara Chen", students: 21, capacity: 22 },
  { name: "Ricardo Reyes", students: 11, capacity: 15 },
  { name: "Kwabena Mensah", students: 8, capacity: 15 },
];

function ringColor(pct: number) {
  if (pct >= 100) return "#DC2626";
  if (pct >= 75) return "#D97706";
  return "#4F5F31";
}

export function WorkloadMockup() {
  return (
    <BrowserFrame title="management/workload">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-4 text-brand-700" />
        <p className="text-sm font-semibold">Lecturer workload</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LECTURERS.map((l) => {
          const pct = Math.round((l.students / l.capacity) * 100);
          return (
            <div key={l.name} className="flex flex-col items-center gap-2 rounded-xl border border-border-strong p-3 text-center">
              <ProgressRing value={Math.min(pct, 100)} size={56} strokeWidth={6} color={ringColor(pct)}>
                <span className="font-display text-xs font-bold">{l.students}</span>
              </ProgressRing>
              <p className="truncate text-[11px] font-medium">{l.name.split(" ")[0]}</p>
            </div>
          );
        })}
      </div>
    </BrowserFrame>
  );
}
