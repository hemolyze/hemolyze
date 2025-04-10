import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Header } from '@/shared/components/layout/Header';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hemolyze",
  description: "Understand your medical reports with intuitive visualizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-gray-50 to-gray-100`}
        >
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
