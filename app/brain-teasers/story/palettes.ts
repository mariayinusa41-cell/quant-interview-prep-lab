// Plain module on purpose: sprites.tsx is "use client", and importing a value
// (not a component) from a client module into a server component yields a
// client reference rather than the object itself. The teaser index is a server
// component and needs the real table, so it lives here.

export type Palette = {
  a: string; // hair / top
  b: string; // skin
  c: string; // clothes
  d?: string; // accent (trim, tie, strap)
  e?: string; // detail (freckles, face paint)
  f?: string; // shirt / light
};

export const PALETTES: Record<string, Palette> = {
  // generic
  red: { a: "#e74c4c", b: "#6b4226", c: "#7a2323", d: "#f4c542" },
  gold: { a: "#f0a53b", b: "#3d2317", c: "#7a4a12", d: "#f4c542" },
  blue: { a: "#4fb3e0", b: "#e3b287", c: "#1c5a78", d: "#f4c542" },
  green: { a: "#59c98f", b: "#8d5524", c: "#1f6b48", d: "#f4c542" },
  purple: { a: "#b98bff", b: "#f0c8a0", c: "#5a3b8f", d: "#f4c542" },
  teal: { a: "#2fd4c4", b: "#c98f5e", c: "#12615a", d: "#f4c542" },
  bone: { a: "#d8d2c4", b: "#c9b79a", c: "#8a8172", d: "#f4c542" },
  brown: { a: "#8a5a30", b: "#c9a06a", c: "#5c3a1e", d: "#f4c542" },

  // office: hair / skin / suit / tie / detail / shirt
  suitBlondeAfro: { a: "#e8c86a", b: "#5c3a24", c: "#243a5e", d: "#b5453f", e: "#4a2e1c", f: "#f4f0e8" },
  suitFreckles: { a: "#a8552e", b: "#f0cba8", c: "#4a4f57", d: "#3f7f6b", e: "#c47a52", f: "#f4f0e8" },
  suitBun: { a: "#2b2018", b: "#c98f5e", c: "#6b2f4a", d: "#e8c86a", e: "#1a1410", f: "#f4f0e8" },
  suitShort: { a: "#3a2c22", b: "#e3b287", c: "#2f4f3a", d: "#c9a04a", e: "#1a1410", f: "#f4f0e8" },
  suitGrey: { a: "#8a8172", b: "#f0cba8", c: "#5a5f68", d: "#4f8fbf", e: "#c47a52", f: "#f4f0e8" },

  // hunters: hair / skin / jacket / strap / face paint
  hunterOlive: { a: "#4a3a24", b: "#8d5524", c: "#3f4a2a", d: "#6b5a3a", e: "#1a1410" },
  hunterRust: { a: "#7a4a2a", b: "#e3b287", c: "#5c3a24", d: "#3f4a2a", e: "#1a1410" },

  // hikers: hair / skin / jacket / headband+straps
  hikerGreen: { a: "#3a2c22", b: "#8d5524", c: "#1f6b48", d: "#f4c542" },
  hikerBlue: { a: "#a8552e", b: "#f0cba8", c: "#1c5a78", d: "#e8c86a" },
  hikerPlum: { a: "#2b2018", b: "#c98f5e", c: "#5a3b8f", d: "#59c98f" },
  hikerRed: { a: "#8a8172", b: "#e3b287", c: "#7a2323", d: "#4fb3e0" },

  // hat puzzle: the hat colour IS the information, so only black/white hats —
  // skin and clothing vary so the line still reads as different people.
  hatBlack1: { a: "#1a1410", b: "#5c3a24", c: "#3f4a5a" },
  hatWhite1: { a: "#f4f0e8", b: "#f0cba8", c: "#4a4f57" },
  hatBlack2: { a: "#1a1410", b: "#c98f5e", c: "#5a5f68" },
  hatWhite2: { a: "#f4f0e8", b: "#8d5524", c: "#3a4a44" },
  hatBlack3: { a: "#1a1410", b: "#e3b287", c: "#4a3a52" },

  // props
  flame: { a: "#ffe28a", b: "#c9a06a", c: "#5c3a1e", d: "#f0a53b" },
  rope: { a: "#c9a06a", b: "#c9a06a", c: "#8a5a30", d: "#c9a06a" },
};
