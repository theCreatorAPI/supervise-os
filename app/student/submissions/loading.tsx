import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/supervise/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <ListRowsSkeleton count={5} />
    </div>
  );
}
