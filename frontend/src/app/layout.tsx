import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocsChat",
  description: "AI-powered document research assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-base">
      <body className={`${GeistSans.className} bg-base text-white`}>{children}</body>
    </html>
  );
}
