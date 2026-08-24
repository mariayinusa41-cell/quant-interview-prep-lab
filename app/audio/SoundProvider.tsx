"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChiptunePlayer, GAME_TRACK, LOBBY_TRACK, SFX, type Track } from "./chiptune";

type SoundContextValue = {
  muted: boolean;
  toggleMute: () => void;
  /** Begin (or resume) the loop. Safe to call repeatedly. */
  startMusic: (which?: "lobby" | "game") => void;
  stopMusic: () => void;
  playSfx: (name: keyof typeof SFX) => void;
};

const MUTE_KEY = "quant_muted";
const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<ChiptunePlayer | null>(null);
  const [muted, setMuted] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  if (playerRef.current === null && typeof window !== "undefined") {
    playerRef.current = new ChiptunePlayer();
  }

  useEffect(() => {
    // Default to muted: audio that starts on its own is hostile, and
    // browsers block it before a gesture anyway.
    try {
      setMuted(window.localStorage.getItem(MUTE_KEY) !== "off");
    } catch {
      setMuted(true);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? "on" : "off");
    } catch {
      /* noop */
    }
    // Muting stops the sequencer outright rather than just zeroing the gain:
    // a silent loop would otherwise keep scheduling oscillators forever and
    // burn CPU for nothing.
    if (muted) {
      playerRef.current?.setVolume(0);
      playerRef.current?.stop();
    } else {
      playerRef.current?.setVolume(0.5);
    }
  }, [muted, hydrated]);

  const value = useMemo<SoundContextValue>(() => {
    const trackFor = (which?: "lobby" | "game"): Track => (which === "game" ? GAME_TRACK : LOBBY_TRACK);

    return {
      muted,
      toggleMute: () =>
        setMuted((prev) => {
          const next = !prev;
          // Unmuting is a user gesture, so it is the right moment to start.
          if (!next) playerRef.current?.start();
          return next;
        }),
      startMusic: (which) => {
        playerRef.current?.start(trackFor(which));
        playerRef.current?.setVolume(muted ? 0 : 0.5);
      },
      stopMusic: () => playerRef.current?.stop(),
      playSfx: (name) => {
        if (muted) return;
        playerRef.current?.blip(SFX[name], name === "wrong" ? "bass" : "lead");
      },
    };
  }, [muted]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);
  // Sound is optional: a component outside the provider should still render.
  return (
    context ?? {
      muted: true,
      toggleMute: () => {},
      startMusic: () => {},
      stopMusic: () => {},
      playSfx: () => {},
    }
  );
}
