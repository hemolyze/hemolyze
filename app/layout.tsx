import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs'

/* const noto = Noto_Sans_Display({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
}); */

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
          className={`${roboto.variable} font-sans antialiased bg-background`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
