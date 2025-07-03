import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlatApply Berlin - Find Your Dream Apartment Faster",
  description: "Get instant notifications for new apartments in Berlin, generate professional applications in German, and apply faster than anyone else.",
  keywords: ["Berlin", "apartment", "flat", "rental", "wohnung", "WG", "housing"],
  authors: [{ name: "FlatApply Berlin" }],
  openGraph: {
    title: "FlatApply Berlin - Find Your Dream Apartment Faster",
    description: "Get instant notifications for new apartments in Berlin",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background`}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
