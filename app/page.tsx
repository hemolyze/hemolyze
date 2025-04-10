import { Button } from "@/shared/components/ui/button"; // Assuming Button component exists
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-theme(spacing.14))] flex-col items-center justify-center px-4 md:px-8 lg:px-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left Column */}
        <div className="flex flex-col gap-6 items-start">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Decode Your <br /> Blood Work. <br /> Effortlessly.
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            Transform complex medical reports into clear, visual insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/new">
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                Upload Report
              </Button>
            </Link>
            <Link href="/sample">
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                View Sample
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            End-to-end encrypted
          </p>
        </div>

        {/* Right Column - Image Placeholder */}
        <div className="relative flex items-center justify-center aspect-square md:aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
          {/* Placeholder for the phone mock-up image */}
          <div className="text-center p-8">
            <p className="text-gray-400 text-sm">Phone Mockup Image Area</p>
            <p className="mt-4 text-xs text-gray-500">Image showing hemoglobin gauge goes here.</p>
          </div>
          {/* You would replace this div with an <Image> component */}
          {/* Example:
          <Image
            src="/path/to/your/phone-mockup.png"
            alt="Phone displaying hemoglobin gauge"
            layout="fill"
            objectFit="contain" // or cover depending on the image
          />
          */}
          {/* Optional: Add the overlay text elements if needed directly here or absolutely positioned */}

        </div>
      </div>
    </main>
  );
}
