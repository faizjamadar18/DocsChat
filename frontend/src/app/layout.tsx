import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
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
      <body className={`${GeistMono.className} bg-base text-white`}>{children}</body>
    </html>
  );
}
