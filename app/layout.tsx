import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scaler Sales Agent — BDA Cockpit",
  description: "Pre-call WhatsApp nudges + post-call personalised PDFs for Scaler BDAs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
