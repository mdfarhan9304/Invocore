import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/app-providers";
import "./globals.css";
import { Instrument_Serif, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "Invocore",
  description: "A calmer way to manage clients, invoices, and getting paid.",
  applicationName: "Invocore",
  appleWebApp: { capable: true, title: "Invocore", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: "Invocore",
    title: "Invocore",
    description: "A calmer way to manage clients, invoices, and getting paid."
  },
  twitter: {
    card: "summary_large_image",
    title: "Invocore",
    description: "A calmer way to manage clients, invoices, and getting paid."
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", manrope.variable, instrumentSerif.variable)}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
