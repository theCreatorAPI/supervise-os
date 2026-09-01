import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/supervise/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>
      <ListRowsSkeleton count={4} />
    </div>
  );
}
