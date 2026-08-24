import type { Metadata, Viewport } from "next";
import "./globals.css";
import AccessShell from "./access/AccessShell";

export const metadata: Metadata = {
  title: "Quant Interview Prep Lab",
  description:
    "A content-first study website based on the topic structure of A Practical Guide to Quantitative Finance Interviews.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Quant Interview Prep Lab",
    description:
      "Chapter map, study plan, practice prompts, and answer frameworks for quant finance interviews.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quant Interview Prep Lab",
    description:
      "Chapter map, study plan, practice prompts, and answer frameworks for quant finance interviews.",
    images: ["/og.png"],
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
