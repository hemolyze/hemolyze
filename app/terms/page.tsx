import { Header } from "@/shared/components/layout/Header";
import Link from "next/link";


export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none text-gray-700">
          <p>Please read these terms of service (&quot;terms&quot;, &quot;terms of service&quot;) carefully before using our website (the &quot;service&quot;) operated by Hemolyze (&quot;us&quot;, &apos;we&quot;, &quot;our&quot;).</p>

          <h2>Conditions of Use</h2>
          <p>We will provide their services to you, which are subject to the conditions stated below in this document. Every time you visit this website, use its services or make a purchase, you accept the following conditions. This is why we urge you to read them carefully.</p>

          <h2>Privacy Policy</h2>
          <p>Before you continue using our website we advise you to read our <Link href="/privacy">privacy policy</Link> regarding our user data collection. It will help you better understand our practices.</p>

          <h2>Copyright</h2>
          <p>Content published on this website (digital downloads, images, texts, graphics, logos) is the property of Hemolyze and/or its content creators and protected by international copyright laws. The entire compilation of the content found on this website is the exclusive property of Hemolyze, with copyright authorship for this compilation by Hemolyze.</p>

          <h2>Communications</h2>
          <p>The entire communication with us is electronic. Every time you send us an email or visit our website, you are going to be communicating with us. You hereby consent to receive communications from us. If you subscribe to the news on our website, you are going to receive regular emails from us. We will continue to communicate with you by posting news and notices on our website and by sending you emails. You also agree that all notices, disclosures, agreements, and other communications we provide to you electronically meet the legal requirements that such communications be in writing.</p>

          <h2>Applicable Law</h2>
          <p>By visiting this website, you agree that the laws of the residing user, without regard to principles of conflict laws, will govern these terms of service, or any dispute of any sort that might come between Hemolyze and you, or its business partners and associates.</p>

          <h2>Disputes</h2>
          <p>Any dispute related in any way to your visit to this website or to products you purchase from us shall be arbitrated by state or federal court United States and you consent to exclusive jurisdiction and venue of such courts.</p>

          <h2>Comments, Reviews, and Emails</h2>
          <p>Visitors may post content as long as it is not obscene, illegal, defamatory, threatening, infringing on intellectual property rights, invasive of privacy, or injurious in any other way to third parties. Content has to be free of software viruses, political campaigns, and commercial solicitation.</p>
          <p>We reserve all rights (but not the obligation) to remove and/or edit such content. When you post your content, you grant Hemolyze non-exclusive, royalty-free and irrevocable right to use, reproduce, publish, modify such content throughout the world in any media.</p>

          <h2>License and Site Access</h2>
          <p>We grant you a limited license to access and make personal use of this website. You are not allowed to download or modify it. This may be done only with written consent from us.</p>

          <h2>User Account</h2>
          <p>If you are an owner of an account on this website, you are solely responsible for maintaining the confidentiality of your private user details (username and password). You are responsible for all activities that occur under your account or password.</p>
          <p>We reserve all rights to terminate accounts, edit or remove content and cancel orders at their sole discretion.</p>
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