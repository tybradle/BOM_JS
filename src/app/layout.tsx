import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SharedHeader } from "@/components/SharedHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATS IA BOM Management Tool",
  description: "CHD BOM Management Tool",
  keywords: ["BOM", "Bill of Materials", "ATS", "Industrial Automation", "PLM", "Eplan"],
  authors: [{ name: "ATS IA" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ATS IA BOM Management Tool",
    description: "CHD BOM Management Tool",
    url: "https://atsindustrialautomation.com/",
    siteName: "ATS IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ATS IA BOM Management Tool",
    description: "CHD BOM Management Tool",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SharedHeader />
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
