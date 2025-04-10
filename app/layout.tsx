import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Hemolyze | Understand Your Lab Results Effortlessly',
  description: 'Transform complex blood work reports into easy-to-understand insights with our AI-powered platform. Get personalized health recommendations based on your lab results.',
  keywords: ['blood work analysis', 'lab results decoder', 'health analytics', 'medical report interpretation', 'AI health insights'],
  authors: [{ name: 'Hemolyze' }],
  creator: 'Hemolyze',
  publisher: 'Hemolyze',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
