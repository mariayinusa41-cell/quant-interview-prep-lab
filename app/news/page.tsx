import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import DarkMode from "../finance/DarkMode";
import NewsBoard from "./NewsBoard";

export const metadata: Metadata = {
  title: "News - Outcry",
  description: "Quant job openings, industry reading, and what's new on Outcry.",
};

export default function NewsPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">
          &larr; Outcry
        </a>
        <NewsBoard />
        <SiteFooter />
      </main>
    </>
  );
}
