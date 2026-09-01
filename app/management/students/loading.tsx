import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/supervise/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <ListRowsSkeleton count={8} />
    </div>
  );
}
