// Site-wide footer: support contact and the policies a paying customer has
// to be able to find. Replaces an attribution to "A Practical Guide to
// Quantitative Finance Interviews" — the games, question banks and
// generators are original and the site is no longer organised around that
// book, so the credit had become inaccurate rather than merely modest.
//
// Stripe checks that Terms and Refund links are reachable from the site
// during business verification, so these need to be in a global footer
// rather than only on /pricing.

export const SUPPORT_EMAIL = "support@outcryarcade.com";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-links" aria-label="Site information">
        <a href="/legal/terms">Terms of Service</a>
        <a href="/legal/privacy">Privacy</a>
        <a href="/legal/refunds">Refunds &amp; Cancellation</a>
        <a href="/pricing">Pricing</a>
        <a href="/news">News</a>
      </nav>

      <p className="site-footer-support">
        Questions, refunds or account help: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <span className="site-footer-sla"> - we aim to reply within 2 business days.</span>
      </p>

      <p className="site-footer-fine">
        Outcry is a practice platform for interview preparation. It is not financial, investment or career advice,
        and does not guarantee any hiring outcome.
      </p>
    </footer>
  );
}
