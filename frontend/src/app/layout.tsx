import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";

export const metadata: Metadata = {
  title: "DocsChat",
  description: "AI-powered workspace and document research assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} bg-[#FBFBFD] text-[#111827] antialiased min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
