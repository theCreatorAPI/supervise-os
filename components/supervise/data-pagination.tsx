import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The "Showing 1–8 of 120" pager the management tables share.
 *
 * Paging is expressed as links rather than client state so a given page stays
 * shareable and survives a reload, matching how the filters on these screens
 * already work.
 */
export function DataPagination({
  page,
  totalPages,
  totalItems,
  firstItem,
  lastItem,
  noun,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  firstItem: number;
  lastItem: number;
  noun: string;
  hrefFor: (page: number) => string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-strong bg-background-elevated px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {firstItem}–{lastItem} of {totalItems} {noun}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={page === 1} asChild={page !== 1}>
            {page === 1 ? <span>Previous</span> : <Link href={hrefFor(page - 1)}>Previous</Link>}
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={hrefFor(n)}
              aria-current={n === page ? "page" : undefined}
              // size-9 rather than padding: a flex parent otherwise squeezes a
              // single digit below a usable tap target.
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                n === page
                  ? "border-brand-600/50 bg-brand-500 text-white"
                  : "border-border-strong bg-white text-muted-foreground hover:bg-black/5"
              )}
            >
              {n}
            </Link>
          ))}

          <Button size="sm" variant="secondary" disabled={page === totalPages} asChild={page !== totalPages}>
            {page === totalPages ? <span>Next</span> : <Link href={hrefFor(page + 1)}>Next</Link>}
          </Button>
        </div>
      )}
    </div>
  );
}
