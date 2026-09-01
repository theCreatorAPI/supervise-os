import { PageHeaderSkeleton, StatCardsSkeleton, TwoColumnCardsSkeleton } from "@/components/supervise/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={5} />
      <TwoColumnCardsSkeleton />
    </div>
  );
}
