import * as React from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";

const SkeletonItem = () => (
  <div className="flex items-center gap-2 px-3 py-1.5">
    <Skeleton className="h-4 w-4 rounded" />
    <Skeleton className="h-4 w-2/3 flex-grow" />
  </div>
);

export function NavDocumentsSkeleton({ className }: { className?: string }) {
  return (
    <nav className={className}>
      {/* Skeleton for Title and Action */}
      <div className="mb-2 flex items-center justify-between px-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      {/* Skeleton for List Items */}
      <div className="space-y-1">
        <SkeletonItem />
        <SkeletonItem />
        <SkeletonItem />
        <SkeletonItem /> 
      </div>
    </nav>
  );
} 