import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton className="size-4 w-4" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 py-5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2 w-full max-w-xs" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ConstellationSkeleton() {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pt-4 pb-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className="flex w-32 flex-col items-center gap-3">
            <Skeleton className="size-14 rounded-2xl" />
            <Skeleton className="h-3 w-16" />
          </div>
          {i < 5 && <Skeleton className="mt-[-28px] h-0.5 w-14" />}
        </div>
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ title = true }: { title?: boolean }) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1 h-3 w-56" />
        </CardHeader>
      )}
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

export function TwoColumnCardsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCardSkeleton />
      <ChartCardSkeleton />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <ChartCardSkeleton title={false} />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
