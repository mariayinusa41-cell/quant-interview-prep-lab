import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import DarkMode from "../finance/DarkMode";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in - Outcry",
  description: "Sign up or log in to a real account.",
};

export default function LoginPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">
          &larr; Outcry
        </a>
        <LoginForm />
        <SiteFooter />
      </main>
    </>
  );
}
