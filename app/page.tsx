"use client";

import { useEffect, useState } from "react";
import AttractScreen from "./AttractScreen";
import Onboarding from "./profile/Onboarding";
import Hub from "./hub/Hub";
import { useProfile } from "./profile/ProfileContext";
import { useSound } from "./audio/SoundProvider";

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const { profile, ready } = useProfile();
  const { startMusic } = useSound();

  // Pressing start is the first user gesture, which is also the only moment
  // a browser will let audio begin.
  const startLab = () => {
    setHasStarted(true);
    startMusic("lobby");
  };

  // "Open sign-in screen" lands here with ?login=1 — skip the attract screen
  // so the sign-in flow is what you actually see.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("login")) setHasStarted(true);
  }, []);

  // Once someone is onboarded, the attract screen should never come back —
  // not on a fresh load, and not after clicking browser-back out of a game.
  // Gating showHub behind `hasStarted` meant every single back-navigation
  // dumped a returning, fully set-up player back at "Press Start" with no
  // way past it except clicking through the splash again. `hasStarted` still
  // gates the *first-time* flow (it's also the required user gesture for
  // audio autoplay), but it's irrelevant once `profile.onboarded` is true.
  const needsOnboarding = hasStarted && ready && !profile.onboarded;
  const showHub = ready && profile.onboarded;
  const showAttract = !showHub && !needsOnboarding;

  return (
    <>
      {showAttract && <AttractScreen onStart={startLab} />}
      {needsOnboarding && <Onboarding />}

      <main className={showHub ? "study-site is-visible" : "study-site"} aria-hidden={!showHub}>
        {showHub && <Hub />}
      </main>
    </>
  );
}
