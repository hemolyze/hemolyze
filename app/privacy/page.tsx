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
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Introduction</h2>
            <p className="text-gray-600">
            This privacy policy ("policy") will help you understand how Hemolyze ("us", "we", "our") uses and protects the data you provide to us when you visit and use our website ("app", "service").
            We reserve the right to change this policy at any given time, of which you will be promptly updated. If you want to make sure that you are up to date with the latest changes, we advise you to frequently visit this page.
            </p>
          </section>

          {/* What information do we collect? */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">What user Data We Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Your IP address</li>
              <li>Your contact information and email address</li>
              <li>Other information such as interests and preferences.</li>
              <li>Data profile regarding your online behavior on our app.</li>
            </ul>
          </section>

          {/* why we collect your data */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Why We Collect Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>To better understand your needs and preferences.</li>
              <li>To improve our app and service.</li>
              <li>To send you promotional emails containing the information we think you will find interesting.</li>
              <li>To contact you to fill out surveys and participate in other types of market research.</li>
              <li>To customize our app according to your online behavior and personal preferences.</li>
            </ul>
          </section>

          {/* Safeguarding and Securing the Data */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Safeguarding and Securing the Data</h2>
            <p className="text-gray-600">
            Hemolyze is committed to securing your data and keeping it confidential. Hemolyze has done all in its power to prevent data theft, unauthorized access, and disclosure by implementing the latest technologies and software, which help us safeguard all the information we collect online.
            </p>
          </section>


          {/* HIPAA Compliance */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">HIPAA Compliance</h2>
            <p className="text-gray-600">
            Hemolyze is fully compliant with HIPAA laws. We adhere to strict regulations regarding the security and privacy of protected health information (PHI). Our AI system, which reads and interprets user medical documents, operates within these legal frameworks to ensure that your sensitive medical information is handled with the highest standards of care.
            </p>
          </section>

          {/* Our Cookie Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Cookie Policy</h2>
            <p className="text-gray-600">
            Once you agree to allow our blog to use cookies, you also agree to use the data it collects regarding your online behavior (analyze web traffic, web pages you visit and spend the most time on).
            The data we collect by using cookies is used to customize our blog to your needs. After we use the data for statistical analysis, the data is completely removed from our systems.
            Please note that cookies don't allow us to gain control of your computer in any way. They are strictly used to monitor which pages you find useful and which you do not so that we can provide a better experience for you.
            If you want to disable cookies, you can do it by accessing the settings of your internet browser. You can visit <a className="text-blue-500 hover:underline" href="https://www.internetcookies.com">https://www.internetcookies.com</a>, which contains comprehensive information on how to do this on a wide variety of browsers and devices.
            </p>
          </section>

          {/* Links to other websites */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Copyright</h2>
            <p className="text-gray-600">
            Our app contains links that lead to other websites. If you click on these links Hemolyze is not held responsible for your data and privacy protection. Visiting those websites is not governed by this privacy policy agreement. Make sure to read the privacy policy documentation of the website you go to from our website.
            </p>
          </section>

          {/* why we collect your data */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Why We Collect Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <p>At some point, you might wish to restrict the use and collection of your personal data. You can achieve this by doing the following:</p>
              <li>If you have already agreed to share your information with us, feel free to contact us via email and we will be more than happy to change this for you.</li>
              <p>Hemolyze will not lease, sell or distribute your personal information to any third parties, unless we have your permission. We might do so if the law forces us. Your personal information will be used when we need to send you promotional materials if you agree to this privacy policy.</p></ul>
          </section>
        </div>
      </main>
    </div>
  );
}