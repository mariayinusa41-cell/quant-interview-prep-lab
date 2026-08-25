import type { Metadata } from "next";
import SiteFooter from "../../SiteFooter";
import DarkMode from "../../finance/DarkMode";
import LegalNav from "../LegalNav";
import "../legal.css";

export const metadata: Metadata = {
  title: "Privacy Policy - Outcry",
  description: "What Outcry collects, why, and what you can do about it.",
};

// Enumerated from db/schema.ts rather than written generically: users,
// sessions, game_scores, drill_runs. Claiming to collect less than the
// schema stores would be the worst kind of inaccuracy in this document.
export default function PrivacyPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Outcry</a>
        <div className="answer-content legal-doc">
          <p className="legal-updated">Last updated 25 August 2026</p>
          <h1 className="pirate-story-line answer-title">Privacy Policy</h1>

          <p>
            This explains what Outcry collects, why, who else sees it, and what you can ask us to do with it.
            We have tried to describe what the system actually stores rather than every category we might
            conceivably use.
          </p>

          <h2>1. What we collect</h2>
          <h3>You give us</h3>
          <ul>
            <li><strong>Email address</strong> &mdash; to identify your account, verify it, and contact you about it.</li>
            <li><strong>Password</strong> &mdash; stored only as a PBKDF2-SHA256 hash with a per-user salt. We never store or see your actual password.</li>
            <li><strong>Username and display name</strong> &mdash; optional, shown on leaderboards.</li>
          </ul>
          <h3>Created as you use it</h3>
          <ul>
            <li><strong>Progress</strong> &mdash; credits, questions answered, and how many were correct.</li>
            <li><strong>Scores</strong> &mdash; per-game results, including score, accuracy and time taken, used for leaderboards.</li>
            <li><strong>Session records</strong> &mdash; a random token in an httpOnly cookie, so you stay signed in.</li>
            <li><strong>A normalised form of your email</strong> &mdash; with dots and +tags removed, used solely to stop one person opening many accounts for extra free credits. It is not used to contact you.</li>
          </ul>
          <h3>We do not collect</h3>
          <ul>
            <li>Card numbers or payment details. Stripe handles payment; we only receive whether a payment succeeded.</li>
            <li>Advertising or cross-site tracking identifiers. There are no third-party ad or analytics trackers.</li>
            <li>Any special-category data (health, biometrics, political or religious views, and so on).</li>
          </ul>

          <h2>2. Why we use it</h2>
          <ul>
            <li>To run your account, keep you signed in, and show your progress &mdash; performance of our contract with you.</li>
            <li>To take payment and grant paid access &mdash; performance of our contract.</li>
            <li>To display leaderboards &mdash; our legitimate interest in a working competitive feature.</li>
            <li>To prevent duplicate accounts and score manipulation &mdash; our legitimate interest in fair access.</li>
            <li>To send verification and account emails &mdash; performance of our contract. We do not send marketing email.</li>
          </ul>

          <h2>3. What is public</h2>
          <p>
            If you appear on a leaderboard, your <strong>username or display name</strong> and your{" "}
            <strong>scores</strong> are visible to anyone. Your email address never is. Choose a display name
            accordingly &mdash; if you would rather not be identifiable, use a handle rather than your real name.
          </p>

          <h2>4. Who else processes it</h2>
          <ul>
            <li><strong>Cloudflare</strong> &mdash; hosting and database. All account and score data is stored here.</li>
            <li><strong>Stripe</strong> &mdash; payment processing. They receive your payment details directly and give us only a result.</li>
            <li><strong>Resend</strong> &mdash; sends verification and account email. They receive your email address.</li>
          </ul>
          <p>
            Job listings and articles are fetched by us from public sources. That is an outbound request from our
            servers, so <strong>no information about you is sent to those sources</strong> and they do not learn
            that you viewed a listing until you click through.
          </p>
          <p>We do not sell your personal data, and we do not share it for advertising.</p>

          <h2>5. How long we keep it</h2>
          <ul>
            <li>Account data: until you delete your account.</li>
            <li>Sessions: until they expire or you log out.</li>
            <li>Scores: until you delete your account, after which they are removed from leaderboards.</li>
            <li>Payment records: as long as tax and accounting law requires, typically several years.</li>
          </ul>

          <h2>6. Your rights</h2>
          <p>
            Depending on where you live &mdash; including under the UK/EU GDPR and California&rsquo;s CCPA/CPRA &mdash;
            you can ask us to give you a copy of your data, correct it, delete it, restrict or object to how we use
            it, or export it. You can also complain to your local data protection authority. We do not charge for
            these requests and we will not treat you differently for making one.
          </p>
          <p>To make a request, email <a href="mailto:support@outcryarcade.com">support@outcryarcade.com</a> from your account address.</p>

          <h2>7. Cookies</h2>
          <p>
            We set one essential cookie: your session token, which is httpOnly, Secure and SameSite=Lax. It exists
            only to keep you signed in. There are no advertising, analytics or tracking cookies, which is why the
            site does not show a cookie banner. Some settings, such as your chosen theme and lab filter, are kept
            in your browser&rsquo;s local storage and never sent to us.
          </p>

          <h2>8. Security</h2>
          <p>
            Passwords are hashed with PBKDF2-SHA256 (100,000 iterations) and a per-user salt. Sessions are random
            server-side tokens, not data we encode into a cookie. Traffic is served over HTTPS. No system is
            perfectly secure, and we cannot guarantee absolute security.
          </p>

          <h2>9. International transfers</h2>
          <p>
            Our providers operate globally, so your data may be processed outside your country, including in the
            United States, under the safeguards those providers offer.
          </p>

          <h2>10. Children</h2>
          <p>
            Outcry is not intended for children under 16. We do not knowingly collect their data; if we learn we
            have, we will delete it.
          </p>

          <h2>11. Changes and contact</h2>
          <p>
            We will post any update here and change the date above. Material changes will be notified by email.
          </p>
          <p>Data controller: [LEGAL ENTITY &mdash; to be completed]. Contact: <a href="mailto:support@outcryarcade.com">support@outcryarcade.com</a>.</p>

          <LegalNav />
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
