import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import DarkMode from "../finance/DarkMode";
import PricingTable from "./PricingTable";

export const metadata: Metadata = {
  title: "Pricing - Outcry",
  description: "Guest, free account, 2-week, and monthly access.",
};

export default function PricingPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">
          &larr; Outcry
        </a>
        <PricingTable />
        <SiteFooter />
      </main>
    </>
  );
}
