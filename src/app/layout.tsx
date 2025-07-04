import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from "@/components/layout/main-nav";
import { getUser } from "@/lib/auth/utils";
import Link from "next/link";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background`}
        suppressHydrationWarning={true}
      >
        <div className="min-h-screen flex flex-col">
          <MainNav user={user} />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t mt-auto">
            <div className="container px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                  <Link href="/terms" className="hover:text-foreground">Terms</Link>
                  <Link href="/contact" className="hover:text-foreground">Contact</Link>
                </div>
                <p className="text-sm text-muted-foreground">
                  © 2024 FlatApply Berlin. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
