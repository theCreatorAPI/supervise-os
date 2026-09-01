export function BrowserFrame({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border border-border-strong bg-white shadow-[0_2px_4px_rgba(16,24,40,0.04),0_20px_48px_-16px_rgba(16,24,40,0.16)] ${className ?? ""}`}>
      <div className="flex min-w-0 items-center gap-2 border-b border-border bg-background-elevated px-4 py-3">
        <span className="size-2.5 shrink-0 rounded-full bg-critical-300" />
        <span className="size-2.5 shrink-0 rounded-full bg-warn-300" />
        <span className="size-2.5 shrink-0 rounded-full bg-success-300" />
        <span className="ml-3 min-w-0 truncate rounded-md bg-white px-3 py-1 text-[11px] text-muted-foreground">
          supervise-os.app/{title}
        </span>
      </div>
      <div className="min-w-0 p-4">{children}</div>
    </div>
  );
}
