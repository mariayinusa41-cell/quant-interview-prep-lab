import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import SiteFooter from "../SiteFooter";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = {
  title: "Forgot password - Outcry",
  description: "Request a link to reset your Outcry password.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/login" className="pirate-back-link">&larr; Sign in</a>
        <div className="answer-content">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line answer-title">Forgot password</h1>
          <ForgotForm />
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
