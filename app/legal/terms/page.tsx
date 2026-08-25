import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import LegalNav from "../LegalNav";
import "../legal.css";

export const metadata: Metadata = {
  title: "Terms of Service - Outcry",
  description: "The terms governing use of Outcry.",
};

// Written against what the code actually does, not boilerplate: the 2-Week
// Pass is a one-time charge (lib/stripe.ts mode "payment") and Monthly is a
// recurring subscription (mode "subscription"). Auto-renewal has to be
// disclosed plainly, and several jurisdictions require it be conspicuous.
//
// Placeholders marked [ ] need a decision only the operator can make.
export default function TermsPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Outcry</a>
        <div className="answer-content legal-doc">
          <p className="legal-updated">Last updated 25 August 2026</p>
          <h1 className="pirate-story-line answer-title">Terms of Service</h1>

          <p>
            These terms govern your use of Outcry (&ldquo;the Service&rdquo;), at outcryarcade.com. By creating an
            account or using the Service you agree to them. If you do not agree, do not use the Service.
          </p>

          <h2>1. What Outcry is</h2>
          <p>
            Outcry is an educational practice platform. It provides interactive exercises, drills and simulations
            covering quantitative finance, probability, statistics and related interview topics, along with a
            listing of publicly advertised job openings and links to third-party reading.
          </p>
          <div className="legal-callout">
            <p>
              Outcry is a study aid. It is not financial, investment, trading, legal, tax or career advice, and it
              does not guarantee any interview outcome, job offer or employment. Simulated trading, betting and
              bankroll exercises use fictional money and are teaching devices, not models you should trade on.
            </p>
          </div>

          <h2>2. Accounts</h2>
          <ul>
            <li>You must provide a valid email address and keep your password confidential.</li>
            <li>You are responsible for activity under your account.</li>
            <li>
              One account per person. We detect and refuse duplicate signups made with address variations of the
              same mailbox, because free credits are granted per person, not per address.
            </li>
            <li>You must be at least 16, or the minimum digital-consent age where you live, whichever is higher.</li>
          </ul>

          <h2>3. Paid plans, billing and renewal</h2>
          <p>Two paid options exist, and they bill differently. Please read this section carefully.</p>
          <h3>2-Week Pass &mdash; $19.99</h3>
          <p>
            A <strong>one-time charge</strong>. It grants access for fourteen days from purchase and then expires.
            It does <strong>not</strong> auto-renew and you will not be charged again.
          </p>
          <h3>Monthly &mdash; $29.99 per month</h3>
          <p>
            A <strong>recurring subscription</strong>. It renews automatically every month and your payment method
            is charged each period until you cancel. You may cancel at any time; cancellation stops future charges
            and access continues to the end of the period already paid for.
          </p>
          <p>
            Prices are in US dollars and exclude any tax that may apply where you live. Payments are processed by
            Stripe; we never receive or store your full card details. We may change prices, but a change will not
            affect a period already paid for, and we will give notice before it applies to a renewal.
          </p>

          <h2>4. Free access and credits</h2>
          <p>
            Some content is free. Other content is unlocked with credits granted to verified accounts, and certain
            items are limited to a set number of uses for free accounts, or reserved for paid plans. Credits have
            no cash value, cannot be transferred, sold or redeemed, and may expire. We may change what any tier
            includes.
          </p>

          <h2>5. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Submit falsified scores, manipulate leaderboards, or automate gameplay.</li>
            <li>Create multiple accounts to obtain additional free credits.</li>
            <li>Share, resell or publish paid content, or share account access.</li>
            <li>Scrape or bulk-copy the Service, or use it to build a competing product.</li>
            <li>Attempt to breach security, access other users&rsquo; data, or disrupt the Service.</li>
          </ul>
          <p>
            We may suspend or terminate an account that breaches these terms. Where we terminate for a breach, we
            are not obliged to refund unused time, subject to your statutory rights.
          </p>

          <h2>6. Content and intellectual property</h2>
          <p>
            The Service, including its exercises, question banks, code and design, belongs to us or our licensors
            and is protected by copyright. You get a personal, non-exclusive, non-transferable licence to use it
            for your own study. Job listings and linked articles belong to their respective sources; we link to
            publicly available postings and reading and claim no ownership of them.
          </p>

          <h2>7. Third-party links</h2>
          <p>
            Job listings and articles link to sites we do not control. We do not endorse them and are not
            responsible for their content, accuracy, availability or hiring decisions. Listings may be filled or
            withdrawn before we next refresh them.
          </p>

          <h2>8. Availability</h2>
          <p>
            We aim to keep the Service running but do not guarantee uninterrupted or error-free access. We may
            change, suspend or discontinue features. If we discontinue the Service entirely while you hold paid
            access, we will refund the unused portion.
          </p>

          <h2>9. Disclaimers and liability</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind to the fullest extent the law
            allows. We are not liable for indirect or consequential losses, lost opportunities, or lost employment.
            Our total liability for any claim is limited to the amount you paid us in the twelve months before it
            arose. Nothing here excludes liability that cannot lawfully be excluded, and your statutory consumer
            rights are unaffected.
          </p>

          <h2>10. Changes to these terms</h2>
          <p>
            We may update these terms. Material changes will be notified by email or in the Service before taking
            effect. Continuing to use the Service after that means you accept the change.
          </p>

          <h2>11. Governing law and contact</h2>
          <p>
            These terms are governed by the laws of [STATE/COUNTRY &mdash; to be completed], without regard to
            conflict-of-laws rules.
          </p>
          <p>Questions about these terms: [CONTACT EMAIL &mdash; to be completed].</p>

          <LegalNav />
        </div>
      </main>
    </>
  );
}
