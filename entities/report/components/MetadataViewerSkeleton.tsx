import { Skeleton } from "@/shared/components/ui/skeleton"

const MetadataViewerSkeleton = () => {
  return (
    <section className="p-4 text-sm">
      {/* Skeleton for Title */}
      <Skeleton className="h-6 w-3/4 mb-1" />
      {/* Skeleton for Report ID */}
      <Skeleton className="h-3 w-1/3 mb-4 pb-3 border-b border-slate-200" />

      {/* Skeleton for Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-4">
        {/* Skeleton for Patient Details Column */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/2 mb-3 pb-1 border-b border-slate-200" /> {/* Skeleton for Section Title */}
          <div className="space-y-2"> {/* Wrapper for items */} 
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/4" /> {/* Label */}
              <Skeleton className="h-4 w-1/2" /> {/* Value */}
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </div>

        {/* Skeleton for Lab & Report Information Column */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4 mb-3 pb-1 border-b border-slate-200" /> {/* Skeleton for Section Title */}
          <div className="space-y-2"> {/* Wrapper for items */} 
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/5" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-1/3" /> {/* Lab Contact Label */}
              <Skeleton className="h-4 w-2/5" /> {/* Lab Contact Value */}
            </div>
          </div>
        </div>
      </div>

      {/* Removed Footer Skeleton */}
    </section>
  )
}

export default MetadataViewerSkeleton 