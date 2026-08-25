import type { Metadata, Viewport } from "next";
import "./globals.css";
import AccessShell from "./access/AccessShell";

export const metadata: Metadata = {
  // Absolute, not relative. vinext does not implement metadataBase, so a
  // relative "/og.png" resolved against whatever host rendered the page —
  // the live site was serving og:image as "http://localhost:3000/og.png",
  // meaning every link shared to Twitter, LinkedIn, Discord or iMessage
  // rendered with no preview image at all.
  title: "Outcry",
  description:
    "Timed, scored quant interview practice: market making, probability, statistics and mental-math drills you play rather than read.",
  // No canonical here on purpose. This is the ROOT layout, so anything set
  // here applies to all 68 pages — a canonical of "/" would tell search
  // engines every page is a duplicate of the homepage and drop the lot from
  // the index. A canonical must be per-page or absent, and vinext does not
  // resolve metadataBase, so a relative one would not work anyway.
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Outcry",
    url: "https://outcryarcade.com",
    title: "Outcry",
    description:
      "Timed, scored quant interview practice: market making, probability, statistics and mental-math drills you play rather than read.",
    images: ["https://outcryarcade.com/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Outcry",
    description:
      "Timed, scored quant interview practice: market making, probability, statistics and mental-math drills you play rather than read.",
    images: ["https://outcryarcade.com/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><AccessShell>{children}</AccessShell></body>
    </html>
  );
}
