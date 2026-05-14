import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Dokandar.app",
    template: "%s | Dokandar.app",
  },
  description:
    "Dokandar.app — বাংলাদেশি দোকানদারদের জন্য হিসাব ও ব্যবস্থাপনা সফটওয়্যার।",
  manifest: "/manifest.json",
  applicationName: "Dokandar.app",
  icons: {
    icon: [
      {
        url: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        url: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
    apple: [{ url: "/icons/icon-192.svg", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dokandar.app",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f172a" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="min-h-screen touch-manipulation bg-background text-lg font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
