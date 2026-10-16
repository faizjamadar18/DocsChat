import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import { AuthSessionProvider } from "../context/AuthContext";
import { ConfirmProvider } from "../context/ConfirmContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://quello.dev"),
  title: "Quello - Your second brain, backed by sources",
  applicationName: "Quello",
  description: "Quello is your second brain for content creation. The unified workspace for modern creators.",
  openGraph: {
    siteName: "Quello",
    title: "Quello - Your second brain, backed by sources",
    description: "Quello is your second brain for content creation. The unified workspace for modern creators.",
    url: "https://quello.dev",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quello - Your second brain, backed by sources",
    description: "Quello is your second brain for content creation. The unified workspace for modern creators.",
  },
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
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Quello",
    url: "https://quello.dev",
    logo: "https://quello.dev/favicon.svg",
  };
  return (
    <html lang="en">
      <body className="min-h-dvh relative bg-base text-text-primary font-base antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <AuthProvider>
          <AuthSessionProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </AuthSessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
