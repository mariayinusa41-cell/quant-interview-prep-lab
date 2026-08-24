"use client";

import TokenIcon from "./access/TokenIcon";

export default function AttractScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="intro-screen"
      role="button"
      tabIndex={0}
      aria-label="Enter Quant Interview Prep Lab"
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
        <h1 className="intro-title">
          <span>Quant</span>
          <span>Interview</span>
          <span className="intro-title-accent">Prep Lab</span>
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
