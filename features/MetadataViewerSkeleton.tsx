import { Skeleton } from "@/shared/components/ui/skeleton"

const MetadataViewerSkeleton = () => {
  return (
    <section className="p-4 text-sm">
      {/* Skeleton for Title */}
      <Skeleton className="h-6 w-3/4 mb-4 pb-3 border-b border-slate-200" />

      {/* Skeleton for Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
        {/* Skeleton for Patient Information */}
        <div className="space-y-2"> {/* Use div for skeleton layout */}
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>

        {/* Skeleton for Lab & Report Information */}
        <div className="space-y-2"> {/* Use div for skeleton layout */}
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex justify-between items-center"> {/* Added items-center */} 
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
      </div>

      {/* Skeleton for Footer Info */}
      <div className="pt-3 border-t border-slate-200 text-center">
        <Skeleton className="h-3 w-1/2 mx-auto" />
      </div>
    </section>
  )
}

export default MetadataViewerSkeleton 