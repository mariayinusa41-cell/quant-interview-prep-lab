"use client";

import TokenIcon from "./access/TokenIcon";
import { OutcryMegaphoneLogo } from "./OutcryMegaphoneLogo";

export default function AttractScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="intro-screen"
      role="button"
      tabIndex={0}
      aria-label="Enter Outcry"
      onClick={onStart}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onStart();
        }
      }}
    >
      <div className="intro-content">
        <p className="intro-eyebrow">Insert coin</p>
        <div className="intro-logo" aria-hidden="true">
          <OutcryMegaphoneLogo size={64} />
        </div>
        <h1 className="intro-title">
          <span className="intro-title-accent">Outcry</span>
        </h1>
        <div className="intro-coin" aria-hidden="true">
          <TokenIcon className="intro-coin-icon" />
        </div>
        <p className="intro-sub">8 labs &middot; 47 games &middot; 1 credit to start</p>
      </div>
      <p className="hint-bubble">Press start</p>
    </div>
  );
}
