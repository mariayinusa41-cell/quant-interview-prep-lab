import React from "react";

export const OutcryMegaphoneLogo: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 10px rgba(244, 197, 66, 0.35))" }}
    >
      {/* Background container */}
      <rect x="2" y="2" width="28" height="28" rx="4" fill="#0f1a2b" stroke="#1a1410" strokeWidth="2" />

      {/* 8-bit Megaphone Horn Body */}
      <rect x="6" y="13" width="4" height="6" fill="#4fb3e0" />
      <rect x="10" y="11" width="4" height="10" fill="#4fb3e0" />
      <rect x="14" y="9" width="4" height="14" fill="#5eb8ff" />
      <rect x="18" y="7" width="2" height="18" fill="#f4c542" />

      {/* Soundwave / Outcry Bursts */}
      <rect x="22" y="10" width="2" height="4" fill="#f4c542" />
      <rect x="22" y="18" width="2" height="4" fill="#f4c542" />
      <rect x="25" y="6" width="2" height="6" fill="#47f0c2" />
      <rect x="25" y="20" width="2" height="6" fill="#47f0c2" />

      {/* Handle */}
      <rect x="8" y="19" width="3" height="5" fill="#f4f0e8" />
    </svg>
  );
};
