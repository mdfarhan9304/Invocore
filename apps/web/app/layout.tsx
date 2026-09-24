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
  title: "Invocore",
  description: "A calmer way to manage clients, invoices, and getting paid."
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
