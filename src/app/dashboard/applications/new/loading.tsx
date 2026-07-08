import { Skeleton } from "@/components/ui/skeleton";

export default function NewApplicationLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-6 w-48" />
      <div className="flex flex-col gap-4 max-w-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
