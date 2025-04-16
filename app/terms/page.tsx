import { Header } from "@/shared/components/layout/Header";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p className="text-gray-600">
              Welcome to Hemolyze. By accessing or using our service, you agree to be bound by these Terms of Service.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Acceptance of Terms</h2>
            <p className="text-gray-600">
            Please read these terms of service (“terms”, “terms of service”) carefully before using our website (the “service”) operated by Hemolyze (“us”, "we”, “our”).
            </p>
          </section>

          {/* Service Description */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Condition of Use</h2>
            <p className="text-gray-600">
            We will provide their services to you, which are subject to the conditions stated below in this document. Every time you visit this website, use its services or make a purchase, you accept the following conditions. This is why we urge you to read them carefully.
            </p>
          </section>

          {/* User Responsibilities */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Use the service in compliance with applicable laws</li>
              <li>Not misuse or abuse the service</li>
            </ul>
          </section>

          {/* Privacy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Privacy</h2>
            <p className="text-gray-600">
              Your privacy is important to us. Please review our{" "}
              <Link href="/privacy" className="text-blue-500 hover:underline">
                Privacy Policy
              </Link>
              {" "}to understand how we collect, use, and protect your information.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Medical Disclaimer</h2>
            <p className="text-gray-600">
              Hemolyze is not a medical service and does not provide medical advice. Always consult with qualified healthcare professionals for medical advice and treatment.
            </p>
          </section>

          {/* Copyright */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Copyright</h2>
            <p className="text-gray-600">
            Content published on this website (digital downloads, images, texts, graphics, logos) 
            is the property of Hemolyze and/or its content creators and protected by international copyright laws. 
            The entire compilation of the content found on this website is the exclusive property of Hemolyze, with copyright authorship for this compilation by Hemolyze.
            </p>
          </section>

          {/* Communications */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Communications</h2>
            <p className="text-gray-600">
            The entire communication with us is electronic. 
            Every time you send us an email or visit our website, you are going to be communicating with us. 
            You hereby consent to receive communications from us. 
            If you subscribe to the news on our website, you are going to receive regular emails from us. 
            We will continue to communicate with you by posting news and notices on our website and by sending you emails. 
            You also agree that all notices, disclosures, agreements, and other communications we provide to you electronically meet the legal requirements that such communications be in writing.
            </p>
          </section>

          {/* Applicable Law */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9 Applicable Law</h2>
            <p className="text-gray-600">
            By visiting this website, you agree that the laws of the residing user, without regard to principles of conflict laws, will govern these terms of service, or any dispute of any sort that might come between Hemolyze and you, or its business partners and associates.
            </p>
          </section>

          {/* Disputes */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Communications</h2>
            <p className="text-gray-600">
            Any dispute related in any way to your visit to this website or to products you purchase from us shall be arbitrated by state or federal court United States and you consent to exclusive jurisdiction and venue of such courts.
            </p>
          </section>

          {/* Comments, Reviews, and Emails */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Communications</h2>
            <p className="text-gray-600">
            Visitors may post content as long as it is not obscene, illegal, defamatory, threatening, infringing on intellectual property rights, invasive of privacy, or injurious in any other way to third parties. Content has to be free of software viruses, political campaigns, and commercial solicitation.
            </p>
          </section>

          {/* License and Site Access */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Communications</h2>
            <p className="text-gray-600">
            We grant you a limited license to access and make personal use of this website. You are not allowed to download or modify it. This may be done only with written consent from us.
            </p>
          </section>

          {/* User Account */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Communications</h2>
            <p className="text-gray-600">
            If you are an owner of an account on this website, you are solely responsible for maintaining the confidentiality of your private user details (username and password). You are responsible for all activities that occur under your account or password.
            We reserve all rights to terminate accounts, edit or remove content and cancel orders at their sole discretion.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
