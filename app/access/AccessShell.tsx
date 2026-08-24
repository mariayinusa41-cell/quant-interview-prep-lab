"use client";

import type { ReactNode } from "react";
import { AccessProvider } from "./AccessContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { ProfileProvider } from "../profile/ProfileContext";
import { SoundProvider } from "../audio/SoundProvider";
import { ThemeProvider } from "../theme/ThemeProvider";
import AccessHud from "./AccessHud";

export default function AccessShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AccessProvider>
        <ProgressProvider>
          <ProfileProvider>
            <SoundProvider>
              <AccessHud />
              {children}
            </SoundProvider>
          </ProfileProvider>
        </ProgressProvider>
      </AccessProvider>
    </ThemeProvider>
  );
}
