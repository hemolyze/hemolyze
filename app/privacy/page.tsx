import { Header } from "@/shared/components/layout/Header";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-700">
          <p>This privacy policy (&quot;policy&quot;) will help you understand how Hemolyze (&quot;us&quot;, &quot;we&quot;, &quot;our&quot;) uses and protects the data you provide to us when you visit and use our website (&quot;app&quot;, &quot;service&quot;).</p>
          <p>We reserve the right to change this policy at any given time, of which you will be promptly updated. If you want to make sure that you are up to date with the latest changes, we advise you to frequently visit this page.</p>

          <h2>What User Data We Collect</h2>
          <p>When you visit the app, we may collect the following data:</p>
          <ul>
            <li>Your IP address.</li>
            <li>Your contact information and email address.</li>
            <li>Other information such as interests and preferences.</li>
            <li>Data profile regarding your online behavior on our app.</li>
          </ul>

          <h2>Why We Collect Your Data</h2>
          <p>We are collecting your data for several reasons:</p>
          <ul>
            <li>To better understand your needs.</li>
            <li>To improve our services and products.</li>
            <li>To send you promotional emails containing the information we think you will find interesting.</li>
            <li>To contact you to fill out surveys and participate in other types of market research.</li>
            <li>To customize our app according to your online behavior and personal preferences.</li>
          </ul>

          <h2>Safeguarding and Securing the Data</h2>
          <p>Hemolyze is committed to securing your data and keeping it confidential. Hemolyze has done all in its power to prevent data theft, unauthorized access, and disclosure by implementing the latest technologies and software, which help us safeguard all the information we collect online.</p>

          <h2>HIPAA Compliance</h2>
          <p>Hemolyze is fully compliant with HIPAA laws. We adhere to strict regulations regarding the security and privacy of protected health information (PHI). Our AI system, which reads and interprets user medical documents, operates within these legal frameworks to ensure that your sensitive medical information is handled with the highest standards of care.</p>

          <h2>Our Cookie Policy</h2>
          <p>Once you agree to allow our app to use cookies, you also agree to use the data it collects regarding your online behavior (analyze web traffic, web pages you visit and spend the most time on).</p>
          <p>The data we collect by using cookies is used to customize our app to your needs. After we use the data for statistical analysis, the data is completely removed from our systems.</p>
          <p>Please note that cookies don&apos;t allow us to gain control of your computer in any way. They are strictly used to monitor which pages you find useful and which you do not so that we can provide a better experience for you.</p>
          <p>If you want to disable cookies, you can do it by accessing the settings of your internet browser. You can visit <a href="https://www.internetcookies.com" target="_blank" rel="noopener noreferrer">https://www.internetcookies.com</a>, which contains comprehensive information on how to do this on a wide variety of browsers and devices.</p>

          <h2>Links to Other Websites</h2>
          <p>Our app contains links that lead to other websites. If you click on these links Hemolyze is not held responsible for your data and privacy protection. Visiting those websites is not governed by this privacy policy agreement. Make sure to read the privacy policy documentation of the website you go to from our website.</p>

          <h2>Restricting the Collection of your Personal Data</h2>
          <p>At some point, you might wish to restrict the use and collection of your personal data. You can achieve this by doing the following:</p>
          <ul>
            <li>When you are filling the forms on the app, make sure to check if there is a box which you can leave unchecked, if you don&apos;t want to disclose your personal information.</li>
            <li>If you have already agreed to share your information with us, feel free to contact us via email and we will be more than happy to change this for you.</li>
          </ul>
          <p>Hemolyze will not lease, sell or distribute your personal information to any third parties, unless we have your permission. We might do so if the law forces us. Your personal information will be used when we need to send you promotional materials if you agree to this privacy policy.</p>
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