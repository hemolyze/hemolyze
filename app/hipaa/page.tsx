import { Header } from "@/shared/components/layout/Header";
import Link from "next/link";
import { Info, ShieldCheck } from 'lucide-react';

export default function HipaaPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8 flex items-center gap-3">
          <ShieldCheck className="text-blue-600 size-8 md:size-10" /> HIPAA Compliance Information
        </h1>
        <div className="prose prose-lg max-w-none text-gray-700">
          <p>
            Hemolyze is committed to protecting the privacy and security of Protected Health Information (PHI) as required by the Health Insurance Portability and Accountability Act of 1996 (HIPAA).
          </p>

          <h2>Our Commitment to HIPAA</h2>
          <p>
            While Hemolyze provides tools to help users understand their health data, the specific applicability of HIPAA regulations may depend on how you use the service and whether you are a covered entity or business associate under HIPAA.
          </p>
          <p>
            For users who are covered entities or business associates requiring HIPAA compliance, we offer specific configurations and potentially Business Associate Agreements (BAAs). Please contact us for more details on our HIPAA-compliant offerings.
          </p>

          <h2>Data Security Measures</h2>
          <p>
            We implement administrative, physical, and technical safeguards designed to protect the confidentiality, integrity, and availability of electronic PHI, including:
          </p>
          <ul>
            <li><strong>Encryption:</strong> Data is encrypted both in transit (using TLS/SSL) and at rest.</li>
            <li><strong>Access Controls:</strong> Strict access controls are in place to limit access to PHI on a need-to-know basis.</li>
            <li><strong>Audit Logs:</strong> We maintain logs of access and changes to systems containing PHI.</li>
            <li><strong>Secure Infrastructure:</strong> We utilize secure cloud infrastructure providers with robust security certifications.</li>
            <li><strong>Data Minimization:</strong> We strive to collect and process only the minimum necessary PHI required for the service.</li>
          </ul>

          <h2>Handling of Uploaded Reports</h2>
          <p>
            When you upload a medical report containing PHI, it is processed within our secure environment. Access to this raw data is strictly limited. The extracted, anonymized, or pseudonymized data used for visualization is also protected by our security measures.
          </p>

          <h2>Business Associate Agreements (BAA)</h2>
          <p>
            If you are a covered entity (e.g., healthcare provider, health plan) or a business associate using Hemolyze to process PHI on behalf of a covered entity, a BAA is typically required. Please contact our compliance team at [Compliance Contact Email/Link] to discuss BAA requirements.
          </p>

          <h2>Disclaimer</h2>
          <p>
            This page provides general information about Hemolyze&apos;s approach to HIPAA. It does not constitute legal advice. Users are responsible for ensuring their own compliance with HIPAA and other applicable regulations.
          </p>

           <p className="mt-8 text-sm text-gray-500">
            <Info size={16} className="inline-block mr-1 align-text-bottom" />
            <strong>Questions?</strong> For specific inquiries regarding HIPAA compliance or our security practices, please reach out to [Compliance Contact Email/Link].
          </p>
        </div>
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