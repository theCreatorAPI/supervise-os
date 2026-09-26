import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Small presentational pieces the management detail screens share: the key/value
 * summary card at the top of a record, a plain bullet list for "requires
 * attention" panels, and the timestamped activity feed that closes most screens.
 *
 * They live together because each is a few lines that would otherwise be copied
 * across five pages and drift apart.
 */

export type DetailField = { label: string; value: React.ReactNode };

/** The facts card that heads a Student, Lecturer or Project detail screen. */
export function DetailSummary({ fields }: { fields: DetailField[] }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <div className="mt-1 text-sm font-medium wrap-break-word">{f.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** A panel of plain observations, as in "Attention Required". */
export function AttentionPanel({
  title,
  description,
  items,
  emptyLabel,
}: {
  title: string;
  description: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <p key={item} className="border-b border-border/60 py-3 text-sm first:pt-0 last:border-0 last:pb-0">
              {item}
            </p>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export type ActivityItem = {
  id: string;
  /** The event itself, e.g. "Samuel Johnson submitted Chapter 3 for review". */
  text: string;
  /** Pre-formatted, since the caller knows whether a relative or absolute date reads better. */
  when: string;
  href?: string;
};

/** The timestamped feed at the foot of the dashboard and most detail screens. */
export function ActivityFeed({
  title,
  description,
  items,
  emptyLabel,
}: {
  title: string;
  description: string;
  items: ActivityItem[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => {
            const row = (
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="min-w-0 text-sm">{item.text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{item.when}</span>
              </div>
            );
            return (
              <div
                key={item.id}
                className={cn(
                  "border-b border-border/60 py-3 first:pt-0 last:border-0 last:pb-0",
                  item.href && "-mx-2 rounded-lg px-2 transition-colors hover:bg-black/3"
                )}
              >
                {item.href ? <Link href={item.href}>{row}</Link> : row}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
