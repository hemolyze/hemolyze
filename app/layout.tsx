import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs'

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
          className={`${inter.variable} font-sans antialiased bg-background overflow-hidden fixed top-0 bottom-0 left-0 right-0`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
