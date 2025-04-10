import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";

export default function Home() {
  return (
    <main>
      <Navbar />
      <section className="py-40 md:ml-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Decode your Blood work.
                <span className="block text-red-500">Effortlessly.</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Transform your blood work into actionable insights with our
                AI-powered platform.
              </p>
              <div className="mt-8 flex flex-col items-center sm:flex-row sm:justify-center lg:justify-start gap-4">
                <a href="" target="_blank">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg border-blue-300 hover:border-blue-300"
                  >
                    Upload Report
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <a href="" target="_blank">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg border-blue-300 hover:border-blue-300"
                  >
                    View Samples
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6 flex items-center justify-center">
              <div className="w-full max-w-md">
                <img
                  src="https://placehold.co/600x400/ff7f7f/ffffff?text=Health+Data"
                  alt="Health Data Visualization"
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
