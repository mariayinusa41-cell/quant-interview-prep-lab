import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantitative Finance Interview Study Site",
  description:
    "A content-first study website based on the topic structure of A Practical Guide to Quantitative Finance Interviews.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Quantitative Finance Interview Study Site",
    description:
      "Chapter map, study plan, practice prompts, and answer frameworks for quant finance interviews.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quantitative Finance Interview Study Site",
    description:
      "Chapter map, study plan, practice prompts, and answer frameworks for quant finance interviews.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
