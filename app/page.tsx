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

  const needsOnboarding = hasStarted && ready && !profile.onboarded;
  const showHub = hasStarted && ready && profile.onboarded;

  return (
    <>
      {!hasStarted && <AttractScreen onStart={startLab} />}
      {needsOnboarding && <Onboarding />}

      <main className={showHub ? "study-site is-visible" : "study-site"} aria-hidden={!showHub}>
        {showHub && <Hub />}
      </main>
    </>
  );
}
