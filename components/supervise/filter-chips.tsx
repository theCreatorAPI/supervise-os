import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A row of pill filters. The reference sheet draws these as select controls
 * ("All departments", "All supervisors", "All statuses"); they are rendered as
 * links so filtering needs no client JavaScript and each combination stays a
 * shareable URL, which is how the rest of the app already filters.
 */
export function FilterChips({
  options,
  active,
  hrefFor,
  label,
}: {
  options: { key: string; label: string }[];
  active: string | undefined;
  hrefFor: (key: string) => string;
  /** Names the group for screen readers, since the chips alone don't say what they filter. */
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const isActive = (active ?? "all") === option.key;
        return (
          <Link
            key={option.key}
            href={hrefFor(option.key)}
            aria-current={isActive ? "true" : undefined}
            // py-2 keeps the chip above a 32px tap target at small sizes.
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              isActive
                ? "border-brand-600/50 bg-brand-500 text-white"
                : "border-border-strong bg-white text-muted-foreground hover:bg-black/5"
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
