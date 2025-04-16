import GaugeSkeleton from "@/shared/components/ui/GaugeSkeleton";

export default function TestViewerSkeleton() {
    // Render a grid of skeletons matching the TestViewer layout
    // Adjust the number of skeletons (e.g., 4 or 8) based on typical loading appearance
    const skeletonCount = 8;

    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {Array.from({ length: skeletonCount }).map((_, index) => (
                <GaugeSkeleton key={index} />
            ))}
        </div>
    );
} 