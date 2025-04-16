import { Header } from "@/shared/components/layout/Header";
import { Button } from "@/shared/components/ui/button"; // Assuming Button component exists
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion"; // Assuming Accordion exists
import Link from "next/link";
import { ShieldCheck, BarChart3, Eye, Activity, UserCheck, Info } from 'lucide-react'; // Example icons

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      {/* Hero Section */}
      <main className="flex flex-col items-center bg-background text-gray-900 w-full">
        <section className="w-full flex flex-col items-center justify-center px-4 md:px-8 lg:px-12 py-16 md:py-24">
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="flex flex-col gap-6 items-start">
              <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-display font-semibold leading-tight">
                Visualize your <br /> blood work. <br /> <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">effortlessly.</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-md tracking-tight">
                Transform complex medical reports into clear, visual insights and track your health trends over time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/new">
                  <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600 shadow-sm">
                    Upload Report
                  </Button>
                </Link>
                <Link href="/sample">
                  <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm">
                    View Sample
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <ShieldCheck size={14} /> End-to-end encrypted & HIPAA compliant options available.
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
              Read our <Link href="/terms" className="text-blue-500 hover:underline">Terms of service</Link> 
              and 
              <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link> 
              for more information.
              </p>
            </div>

            {/* Right Column - Image Placeholder */}
            <div className="relative flex items-center justify-center aspect-square md:aspect-[3/4] bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-lg overflow-hidden shadow-lg">
              {/* Placeholder for the phone mock-up image */}
              <div className="text-center p-8">
                <BarChart3 size={64} className="text-blue-500 mx-auto mb-4" />
                <p className="text-gray-500 text-sm font-medium">Visual Health Dashboard</p>
                <p className="mt-2 text-xs text-gray-400">Clear graphs replace confusing numbers.</p>
              </div>
              {/* Replace with <Image> component later */}
            </div>
          </div>
        </section>

        {/* Problem Statement Section */}
        <section className="w-full bg-gray-50 py-16 md:py-24 px-4 md:px-8 lg:px-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Tired of Confusing Medical Jargon?</h2>
            <p className="text-lg text-gray-600">
              Traditional lab reports are dense, difficult to understand, and make it hard to see your health trends. You deserve clarity.
            </p>
          </div>
        </section>

        {/* Solution Showcase Section */}
        <section className="w-full py-16 md:py-24 px-4 md:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Health Data, Simplified.</h2>
              <p className="text-lg text-gray-600">
                Hemolyze automatically extracts data from your uploaded reports and transforms it into easy-to-understand visualizations. Track key markers, understand ranges, and see your progress over time, all in one place.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-4">
                <li>Clear, interactive charts and graphs.</li>
                <li>Historical trend tracking.</li>
                <li>Explanation of common biomarkers.</li>
                <li>Secure and private data handling.</li>
              </ul>
            </div>
            <div className="relative flex items-center justify-center aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md">
              <Eye size={48} className="text-gray-400" />
              <p className="absolute bottom-4 text-xs text-gray-500">Visualization Placeholder</p>
              {/* Placeholder for screenshot/graphic */}
            </div>
          </div>
        </section>

        {/* Interactive Demo Preview Section */}
        <section className="w-full bg-gray-900 text-white py-16 md:py-24 px-4 md:px-8 lg:px-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">See It In Action</h2>
            <p className="text-lg text-gray-300 mb-8">
              Experience how easy it is to understand your health data. (
            </p>
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-xl flex items-center justify-center">
              <Activity size={64} className="text-gray-500" />
              <p className="absolute bottom-4 text-xs text-gray-400">Interactive Demo Area</p>
            </div>
          </div>
        </section>

        {/* Benefits Grid Section */}
        <section className="w-full py-16 md:py-24 px-4 md:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-12">Unlock a Clearer View of Your Health</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {/* Benefit 1 */}
              <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <Eye size={32} className="text-blue-600" />
                <h3 className="text-xl font-semibold">Gain Clarity</h3>
                <p className="text-gray-600 text-sm">Understand complex results instantly with intuitive visuals.</p>
              </div>
              {/* Benefit 2 */}
              <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <BarChart3 size={32} className="text-green-600" />
                <h3 className="text-xl font-semibold">Track Progress</h3>
                <p className="text-gray-600 text-sm">Monitor your health trends over time to see what&apos;s changing.</p>
              </div>
              {/* Benefit 3 */}
              <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <UserCheck size={32} className="text-purple-600" />
                <h3 className="text-xl font-semibold">Empower Yourself</h3>
                <p className="text-gray-600 text-sm">Take control of your health journey with actionable insights.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-blue-600 text-white py-16 md:py-20 px-4 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">Ready to Understand Your Health Better?</h2>
            <p className="text-lg text-blue-100 mb-8">
              Upload your first report securely and see the difference clarity makes.
            </p>
            <Link href="/new">
              <Button size="lg" variant="outline" className="bg-white text-blue-700 border-white hover:bg-gray-100 shadow-md px-8 py-3 text-base font-semibold">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-16 md:py-24 px-4 md:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-10">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-medium">Is my health data secure?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600">
                  Yes, security is our top priority. We use end-to-end encryption and follow industry best practices. For sensitive data, HIPAA-compliant options are available. Your data is yours alone.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-medium">What types of reports can I upload?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600">
                  Currently, we support common blood test reports in PDF format. We are continuously working to expand compatibility with more report types and formats.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-medium">Is this a replacement for consulting my doctor?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600">
                  No. Hemolyze is an informational tool designed to help you understand your health data better. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor with any health concerns.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg font-medium">How much does it cost?</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600">
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

        {/* Main Footer */}
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

      </main>
    </div>
  );
}
