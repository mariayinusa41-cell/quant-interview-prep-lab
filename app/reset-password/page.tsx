import type { Metadata } from "next";
import { Suspense } from "react";
import DarkMode from "../finance/DarkMode";
import SiteFooter from "../SiteFooter";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Reset password - Outcry",
  description: "Choose a new password for your Outcry account.",
  // A reset link must never end up in a search index.
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/login" className="pirate-back-link">&larr; Sign in</a>
        <div className="answer-content">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line answer-title">Choose a new password</h1>
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
