import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import LegalNav from "../LegalNav";
import "../legal.css";

export const metadata: Metadata = {
  title: "Refund Policy - Outcry",
  description: "When Outcry refunds, how to ask, and how long it takes.",
};

// Stripe asks for a refund policy URL during business verification, and a
// vague one invites disputes. This states a concrete window and a concrete
// process, because "contact us and we'll see" is what generates chargebacks.
export default function RefundsPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Outcry</a>
        <div className="answer-content legal-doc">
          <p className="legal-updated">Last updated 25 August 2026</p>
          <h1 className="pirate-story-line answer-title">Refund Policy</h1>

          <div className="legal-callout">
            <p>
              Short version: if Outcry is not what you expected, email us within 7 days of paying and we will
              refund you in full. You do not need to justify it.
            </p>
          </div>

          <h2>7-day refund window</h2>
          <p>
            Both the 2-Week Pass and the first month of a Monthly subscription can be refunded in full within{" "}
            <strong>7 days of the charge</strong>. Ask and we refund &mdash; no explanation required.
          </p>
          <p>
            We may decline where there is clear evidence of abuse, such as repeatedly buying and refunding, or an
            account terminated for breaching the Terms.
          </p>

          <h2>After 7 days</h2>
          <ul>
            <li>
              <strong>2-Week Pass.</strong> A one-time purchase for a fixed period. After the window it is
              generally non-refundable, since the access has been delivered.
            </li>
            <li>
              <strong>Monthly.</strong> Cancel any time to stop future charges. We do not usually refund a period
              already under way, but access continues to the end of it. Renewals that were genuinely unintended
              are dealt with under &ldquo;Accidental renewals&rdquo; below.
            </li>
          </ul>

          <h2>Cancelling a subscription</h2>
          <p>
            Cancelling stops the next charge. It does not remove access you have already paid for &mdash; that runs
            to the end of the current period. To cancel, email us from your account address and we will action it
            and confirm.
          </p>

          <h2>Accidental renewals</h2>
          <p>
            If a subscription renewed and you had not used Outcry during that period, tell us within 14 days of the
            charge and we will refund it. We would rather refund an unused month than argue about it.
          </p>

          <h2>If something is broken</h2>
          <p>
            If a fault stops you using what you paid for and we cannot fix it in reasonable time, we will refund
            the affected period regardless of the 7-day window. The same applies if we discontinue the Service
            while you hold paid access.
          </p>

          <h2>How to request one</h2>
          <p>
            Email [CONTACT EMAIL &mdash; to be completed] from the address on your account, with the approximate
            date of the charge. We aim to reply within 2 business days.
          </p>
          <p>
            Approved refunds go back to the original payment method through Stripe. Your bank typically takes 5&ndash;10
            business days to post it, which is outside our control.
          </p>

          <h2>Chargebacks</h2>
          <p>
            Please contact us before raising a chargeback. Chargebacks cost us a fee and take far longer to resolve
            than simply asking. We have never refused a refund inside the window.
          </p>

          <h2>Your statutory rights</h2>
          <p>
            Nothing here limits rights you have by law. In the UK and EU you generally have a 14-day right to
            cancel a distance purchase, though that right can end once you start using digital content you agreed
            to have supplied immediately. Where your statutory rights are stronger than this policy, they apply.
          </p>

          <LegalNav />
        </div>
      </main>
    </>
  );
}
