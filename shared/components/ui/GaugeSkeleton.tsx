import { Skeleton } from "@/shared/components/ui/skeleton";

export default function GaugeSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm bg-card text-card-foreground w-96 h-96 gap-4">
            {/* Title Skeleton */}
            <Skeleton className="h-6 w-3/4 rounded-md" />
            {/* Gauge Arc Skeleton */}
            <div className="relative w-48 h-24">
                <Skeleton className="absolute top-0 left-0 w-full h-full rounded-t-full border-b-transparent" />
            </div>
            {/* Value Skeleton */}
            <Skeleton className="h-5 w-1/2 rounded-md" />
            {/* Status Skeleton */}
            <Skeleton className="h-4 w-1/4 rounded-md" />
        </div>
    );
} 