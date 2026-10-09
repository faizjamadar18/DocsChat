import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";

export const metadata: Metadata = {
  title: "Home | Plura",
  description: "Your second brain for content creation. The unified workspace for modern creators.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh relative bg-base text-text-primary font-base antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
