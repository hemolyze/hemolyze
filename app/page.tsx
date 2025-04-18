import { Header } from "@/shared/components/layout/Header";
import { Button } from "@/shared/components/ui/button"; // Assuming Button component exists
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion"; // Assuming Accordion exists
import Link from "next/link";
import { ShieldCheck, BarChart3, Eye, UserCheck, Info } from 'lucide-react'; // Example icons
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center bg-background text-gray-900 w-full">
        <section className="w-full flex flex-col items-center justify-center px-4 md:px-8 lg:px-12 py-16 md:py-24">
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="flex flex-col gap-6 items-start">
              <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-display font-semibold leading-tight dark:text-gray-100">
                Finally Understand <br /> Your Blood Work. <br /> <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">Instantly.</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md tracking-tight">
                Stop guessing what your lab results mean. Upload <span className="font-bold">any</span> report, see clear visuals, and track your health journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/new">
                  <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600 shadow-sm">
                    Upload Report
                  </Button>
                </Link>
                <Link href="/sample">
                  <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 shadow-sm">
                    View Sample
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <ShieldCheck size={14} /> Encrypted & HIPAA options available.
              </p>
            </div>

            {/* Right Column - Image Placeholder */}
            {/* <div className="relative flex items-center justify-center aspect-square bg-white rounded-lg overflow-hidden border">
            </div> */}
            <div className="relative flex justify-center items-center flex-col gap-4 md:min-w-1/2 h-[30rem] overflow-hidden md:overflow-visible">
              <Image src="/images/1.webp" alt="Gauges" className="object-contain w-full h-full" width={1000} height={1000} />
            </div>
          </div>
        </section>

        {/* Problem Statement Section */}
        <section className="w-full bg-gray-50 dark:bg-gray-900 py-16 md:py-24 px-4 md:px-8 lg:px-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 dark:text-gray-100">Lab Reports Got You Confused?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Traditional lab reports are dense, difficult to understand, and make it hard to see your health trends. You deserve clarity.
            </p>
          </div>
        </section>

        {/* Solution Showcase Section */}
        <section className="w-full py-16 md:py-24 px-4 md:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight dark:text-gray-100">Your Health Data, Simplified.</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Hemolyze automatically extracts data from your uploaded reports and transforms it into easy-to-understand visualizations. Track key markers, understand ranges, and see your progress over time, all in one place.
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                <li>Clear, interactive charts and graphs.</li>
                <li>Historical trend tracking.</li>
                <li>AI-powered chat for quick explanations.</li>
                <li>Explanation of common biomarkers.</li>
                <li>Secure and private data handling.</li>
              </ul>
            </div>
            <div className="relative w-72 mx-auto">
              <Image src="/images/2.webp" alt="Gauges" className="shadow-md rounded-md object-contain relative w-full h-auto" width={500} height={500} />
            </div>
          </div>
        </section>

        {/* Interactive Demo Preview Section */}
        <section className="w-full bg-gray-900 text-white py-16 md:py-24 px-4 md:px-8 lg:px-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">Explore the Clarity</h2>
            <p className="text-lg text-gray-300 mb-8">
              Experience how easy it is to understand your health data.
            </p>
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-xl flex items-center justify-center">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dbsN76Sa35E?autoplay=1&mute=1&playsinline=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0" 
                title="Hemolyze Demo" 
                allow="autoplay; encrypted-media;"
              />
            </div>
          </div>
        </section>

        {/* Benefits Grid Section */}
        <section className="w-full py-16 md:py-24 px-4 md:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12 dark:text-gray-100">Unlock a Clearer View of Your Health</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {/* Benefit 1 */}
              <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <Eye size={32} className="text-blue-600" />
                <h3 className="text-xl font-semibold dark:text-gray-100">Gain Clarity</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Understand complex results instantly with intuitive visuals.</p>
              </div>
              {/* Benefit 2 */}
              <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <BarChart3 size={32} className="text-green-600" />
                <h3 className="text-xl font-semibold dark:text-gray-100">Track Progress</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Monitor your health trends over time to see what&apos;s changing.</p>
              </div>
              {/* Benefit 3 */}
              <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <UserCheck size={32} className="text-purple-600" />
                <h3 className="text-xl font-semibold dark:text-gray-100">Empower Yourself</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Take control of your health journey with actionable insights.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-blue-600 text-white py-16 md:py-20 px-4 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">Ready for Clearer Health Insights?</h2>
            <p className="text-lg text-blue-100 mb-8">
              Upload your first report securely and see the difference clarity makes.
            </p>
            <Link href="/new">
              <Button size="lg" variant="outline" className="bg-white text-blue-700 border-white hover:bg-gray-100 shadow-md px-8 py-3 text-base font-semibold dark:bg-white dark:text-blue-700 dark:border-white dark:hover:bg-gray-100">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-16 md:py-24 px-4 md:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-10 dark:text-gray-100">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-medium dark:text-gray-100">Is my health data secure?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600 dark:text-gray-400">
                  Yes, security is our top priority. We use end-to-end encryption and follow industry best practices. For sensitive data, HIPAA-compliant options are available. Your data is yours alone.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-medium dark:text-gray-100">What types of reports can I upload?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600 dark:text-gray-400">
                  Currently, we support common blood test reports in PDF format. We are continuously working to expand compatibility with more report types and formats.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-medium dark:text-gray-100">Is this a replacement for consulting my doctor?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600 dark:text-gray-400">
                  No. Hemolyze is an informational tool designed to help you understand your health data better. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor with any health concerns.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg font-medium dark:text-gray-100">How much does it cost?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600 dark:text-gray-400 ">
                  (Pricing details will go here - e.g., Mention freemium model, subscription tiers, etc.) We plan to offer a free tier for basic use and premium features for advanced tracking and analysis.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Doctor Disclaimer Footer */}
        <section className="w-full bg-gray-100 py-8 px-4 md:px-8 lg:px-12 border-t border-gray-200">
          <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
            <Info size={16} className="inline-block mr-1 align-text-bottom" />
            <strong>Disclaimer:</strong> Hemolyze provides informational insights based on your uploaded data. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </div>
        </section>
      </main>

      {/* Replicated Footer */}
      <footer className="w-full bg-gray-900 text-gray-400 py-8 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs">
          <p>&copy; {new Date().getFullYear()} Hemolyze. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="https://github.com/hemolyze/hemolyze" className="hover:text-white">Github</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/hipaa" className="hover:text-white">HIPAA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
