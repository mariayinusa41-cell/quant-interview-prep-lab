// Pixel avatars, drawn as 16x16 character grids so they stay editable by
// hand. 16 rather than 10 buys a keyline, a base tone, a highlight, a body
// shade, whites-and-pupil eyes and a cheek blush on every character.
// Each key maps into that avatar's own palette; "." is transparent.
// Same crispEdges/SVG approach as TokenIcon so everything matches.
//
// Shared armature: rows 0-9 are the head, rows 10-15 the body (BODY), so a
// new character usually only needs its own top rows and muzzle.

export type AvatarId =
  | "duck"
  | "frog"
  | "bird"
  | "pig"
  | "cat"
  | "robot"
  | "monster"
  | "princess"
  | "bull"
  | "bear"
  | "fox"
  | "owl"
  | "horse"
  | "knight"
  | "dolphin"
  | "dino"
  | "pirate"
  | "deer"
  | "penguin"
  | "ghost"
  | "alien"
  | "dragon"
  | "panda"
  | "wolf"
  | "shark"
  | "astronaut"
  | "ninja";

type AvatarDef = {
  id: AvatarId;
  name: string;
  /**
   * Grouping label ("Starter", "Animals", …). Every entry carries one, but
   * the handoff's own type omitted it, so the file did not compile as
   * shipped. Declared here rather than stripped from 27 entries — a picker
   * with this many characters wants sections.
   */
  tag: string;
  grid: string[];
  palette: Record<string, string>;
};

const OUTLINE = "#1a1410";
const EYE = OUTLINE;
const K = OUTLINE;
const W = "#f4f0e8";
const P = "#ff9aa8";

// Shared 16x16 chibi armature: big head (rows 0-9), small body (10-15).
// a base · b shade · c highlight · d accent · w eye white · p blush · k keyline
const BODY = [
  "..kkaaaaaaaakk..",
  "....kkaaaakk....",
  "...kbaaaaaabk...",
  "..kbbaaaaaabbk..",
  "..kbaaaaaaaabk..",
  "...kdd....ddk...",
];
const EYES = ".kawwkaaaakwwak.";

export const AVATARS: AvatarDef[] = [
  {
    id: "duck", name: "Duck", tag: "Starter",
    palette: { a: "#f4c542", b: "#d9a52c", c: "#ffe28a", d: "#e8873c", w: W, k: K, p: P },
    grid: [
      ".....kkkkkk.....",
      "...kkcccccckk...",
      "..kcccccccccck..",
      ".kcccccccccccck.",
      ".kaaaaaaaaaaaak.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kpaadddddaapak.",
      "..kaaaddddaaak..",
      ...BODY,
    ],
  },
  {
    id: "frog", name: "Frog", tag: "Starter",
    palette: { a: "#59c98f", b: "#35946a", c: "#8ce8b8", d: "#2f8f60", w: W, k: K, p: P },
    grid: [
      "..kkk......kkk..",
      ".kcwwk....kwwck.",
      ".kwwkk....kkwwk.",
      ".kaaak....kaaak.",
      "..kaaaaaaaaaak..",
      ".kcaaaaaaaaaack.",
      ".kaaaaaaaaaaaak.",
      ".kaakkkkkkkkaak.",
      ".kpaaaaaaaaaapk.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "bird", name: "Bird", tag: "Starter",
    palette: { a: "#4fb3e0", b: "#2b7fb0", c: "#8fd8f5", d: "#e8873c", w: W, k: K, p: P },
    grid: [
      "......kk........",
      ".....kck........",
      ".....kck........",
      "..kkkcccckk.....",
      ".kcccccccccck...",
      ".kawwkaaaakwwk..",
      ".kawwkaaaakwwk..",
      ".kaaaaaaaaaaddk.",
      ".kpaaaaaaaaadk..",
      "..kaaaaaaaaak...",
      ...BODY,
    ],
  },
  {
    id: "pig", name: "Pig", tag: "Starter",
    palette: { a: "#f2a3b3", b: "#d97e92", c: "#ffc9d4", d: "#c96b80", w: W, k: K, p: "#ff7f95" },
    grid: [
      "..kk........kk..",
      ".kaak......kaak.",
      ".kaaakkkkkkaaak.",
      "..kaaaaaaaaaak..",
      ".kcaaaaaaaaaack.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kpaaaddddaaapk.",
      "..kaaadkdkaaak..",
      ...BODY,
    ],
  },
  {
    id: "cat", name: "Cat", tag: "Starter",
    palette: { a: "#8a8f98", b: "#5c6068", c: "#b8bdc6", d: "#ff9aa8", w: W, k: K, p: P },
    grid: [
      "..kk........kk..",
      ".kaak......kaak.",
      ".kabak....kabak.",
      ".kaaakkkkkkaaak.",
      "..kaaaaaaaaaak..",
      ".kcwwkaaaakwwck.",
      ".kawwkaaaakwwak.",
      ".kaaaaaddaaaaak.",
      ".kpaakkaakkaapk.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "robot", name: "Robot", tag: "Starter",
    palette: { a: "#b8c0cc", b: "#6b7480", c: "#4fb3e0", d: "#47f0c2", w: W, k: K, p: "#e74c4c" },
    grid: [
      ".......kk.......",
      ".......kk.......",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      ".kaccccccccccak.",
      ".kacwwkaakwwcak.",
      ".kacwwkaakwwcak.",
      ".kaccccccccccak.",
      ".kaakddddddkaak.",
      ".kaaaaaaaaaaaak.",
      ...BODY,
    ],
  },
  {
    id: "monster", name: "Monster", tag: "Starter",
    palette: { a: "#4a9d52", b: "#2f6b36", c: "#7ec98a", d: "#e74c4c", w: W, k: K, p: P },
    grid: [
      "..kk........kk..",
      ".kaak......kaak.",
      ".kaaakkkkkkaaak.",
      ".kaaaaaaaaaaaak.",
      ".kcaaaaaaaaaack.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kaakwkwkwkkaak.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "princess", name: "Princess", tag: "Starter",
    palette: { a: "#8a5a34", b: "#b98bff", c: "#f4c542", d: "#c9425c", h: "#241812", w: W, k: K, p: "#c9607a" },
    grid: [
      "....k..k..k.....",
      "....kckckckck...",
      "..kkcccccccck...",
      ".khhhhhhhhhhhhk.",
      ".khaaaaaaaaaahk.",
      ".khwwkaaaakwwhk.",
      ".khwwkaaaakwwhk.",
      ".khaaaaddaaaahk.",
      "..khaaaaaaaahk..",
      "...kkaaaaaakk...",
      "..kkbbbbbbbbkk..",
      "..kbbbbbbbbbbk..",
      ".kbbbbbbbbbbbbk.",
      ".kbbbbbbbbbbbbk.",
      ".kbbbbbbbbbbbbk.",
      ".kkkkkkkkkkkkkk.",
    ],
  },
  {
    id: "bull", name: "Bull", tag: "New",
    // Horns carry the silhouette: 2px wide, sweeping out to the very edge and
    // stepping up, in the bone tone. The muzzle is brown, not pink — a pink
    // snout made this read as a brown Pig, and Pig is already in the set.
    palette: { a: "#8a5a30", b: "#5c3a1e", c: "#c9a06a", d: "#7a4a2b", w: W, k: K, p: P },
    grid: [
      "kcck........kcck",
      ".kcckkkkkkkkcck.",
      "..kaaaaaaaaaak..",
      ".kcaaaaaaaaaack.",
      ".kaaaaaaaaaaaak.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kpaaddddddaapk.",
      "..kaddkddkddak..",
      ...BODY,
    ],
  },
  {
    id: "bear", name: "Bear", tag: "New",
    palette: { a: "#b98a5e", b: "#8a5f3a", c: "#e0bb8f", d: "#7a4a2b", w: W, k: K, p: P },
    grid: [
      "..kkk......kkk..",
      ".kcaak....kaack.",
      ".kaaakkkkkkaaak.",
      "..kaaaaaaaaaak..",
      ".kcaaaaaaaaaack.",
      EYES, EYES,
      ".kaaaaddddaaaak.",
      ".kpaaadkkdaaapk.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "fox", name: "Fox", tag: "New",
    palette: { a: "#e8873c", b: "#b35a1e", c: "#ffb069", d: "#2b1a10", w: W, k: K, p: P },
    grid: [
      ".kk..........kk.",
      "kbak........kabk",
      "kbaak......kaabk",
      ".kaaakkkkkkaaak.",
      "..kaaaaaaaaaak..",
      ".kcwwkaaaakwwck.",
      ".kawwkaaaakwwak.",
      ".kaaawwwwwwaaak.",
      ".kpaawwddwwaapk.",
      "..kaaawwwwaaak..",
      ...BODY,
    ],
  },
  {
    id: "owl", name: "Owl", tag: "New",
    palette: { a: "#a8763c", b: "#7a5228", c: "#d4a76a", d: "#f4c542", w: W, k: K, p: P },
    grid: [
      ".kk..........kk.",
      ".kck........kck.",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      ".kawwwkaakwwwak.",
      ".kawkwkaakwkwak.",
      ".kawwwkaakwwwak.",
      ".kaaaaaddaaaaak.",
      ".kpaaaaddaaaapk.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "horse", name: "Horse", tag: "New",
    palette: { a: "#b0805a", b: "#8a5f3a", c: "#3a2a1c", d: "#d4a882", w: W, k: K, p: P },
    grid: [
      "..kk........kk..",
      ".kaak..cc..kaak.",
      ".kaaakkcckkaaak.",
      "..kaaaaaaaaaak..",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      "..kaaddddddaak..",
      "...kaddkddkdak..",
      "...kkaaaaaakk...",
      ...BODY,
    ],
  },
  {
    id: "knight", name: "Knight", tag: "New",
    palette: { a: "#b8c0cc", b: "#6b7480", c: "#e0e6f0", d: "#2b3340", e: "#e74c4c", w: W, k: K, p: P },
    grid: [
      ".......ee.......",
      "......keek......",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      ".kaddddddddddak.",
      ".kaawwkaakwwaak.",
      ".kaddddddddddak.",
      ".kaaaaaaaaaaaak.",
      ".kaakkkkkkkkaak.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "dolphin", name: "Dolphin", tag: "New",
    palette: { a: "#6fb8d6", b: "#3d87a8", c: "#a8dcee", d: "#cfe8f2", w: W, k: K, p: P },
    grid: [
      "......kck.......",
      ".....kcck.......",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      EYES, EYES,
      ".kaaaaaaaaaaddk.",
      ".kpaaaaaaaaddk..",
      "..kaaaaaaaadk...",
      "..kkaaaaaaak....",
      ...BODY,
    ],
  },
  {
    id: "dino", name: "Dino", tag: "New",
    palette: { a: "#59c98f", b: "#35946a", c: "#8ce8b8", d: "#2f8f60", w: W, k: K, p: P },
    grid: [
      "....k...k...k...",
      "...kck.kck.kck..",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kaaddddddddaak.",
      ".kaadwdwdwdwaak.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "pirate", name: "Pirate", tag: "New",
    palette: { a: "#e3b287", b: "#6b4a2a", c: "#ffd9b8", d: "#e74c4c", e: "#7a2323", w: W, k: K, p: P },
    grid: [
      "..kkkkkkkkkkkk..",
      ".kddddddddddddk.",
      ".kaddddddddddak.",
      ".kaaaaaaaaaaaak.",
      ".kakkkaaaakwwak.",
      ".kaakkaaaakwwak.",
      ".kaaaaaaaaaaaak.",
      ".kpaaaaeeaaaapk.",
      "..kbbbbbbbbbbk..",
      "...kkbbbbbbkk...",
      ...BODY,
    ],
  },
  {
    id: "deer", name: "Deer", tag: "New",
    palette: { a: "#c9925e", b: "#9a6a3c", c: "#e8d0a8", d: "#7a4a2b", w: W, k: K, p: P },
    grid: [
      "kck..........kck",
      ".kck...cc...kck.",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kaaaaddddaaaak.",
      ".kpaaadkkdaaapk.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "penguin", name: "Penguin", tag: "New",
    palette: { a: "#2b3340", b: "#1a1f28", c: "#f4f0e8", d: "#f4c542", w: "#ffffff", k: K, p: P },
    grid: [
      "....kkkkkkkk....",
      "..kkaaaaaaaakk..",
      ".kaaaaaaaaaaaak.",
      ".kaaccccccccaak.",
      ".kacwwkcckwwcak.",
      ".kacwwkcckwwcak.",
      ".kaccccddccccak.",
      ".kaacccddcccaak.",
      ".kaaaccccccaaak.",
      "..kaaccccccaak..",
      ...BODY,
    ],
  },
  {
    id: "ghost", name: "Ghost", tag: "New",
    palette: { a: "#d8dce6", b: "#a8b0bf", c: "#f4f0e8", d: "#a8b0bf", w: W, k: K, p: P },
    grid: [
      "....kkkkkkkk....",
      "..kkaaaaaaaakk..",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kakkaaaakkaaak.",
      ".kakkaaaakkaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaakkkkaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kakkaakkaakkak.",
      "..k..kk..kk..k..",
    ],
  },
  {
    id: "alien", name: "Alien", tag: "New",
    palette: { a: "#9ae86a", b: "#6bb844", c: "#47f0c2", d: "#6bb844", w: W, k: K, p: "#c9f0a8" },
    grid: [
      "...k......k.....",
      "...kc....ck.....",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      ".kakkkaaakkkaak.",
      ".kakkkaaakkkaak.",
      ".kaaaaaaaaaaaak.",
      ".kpaaaakkaaaapk.",
      "..kaaaaaaaaaak..",
      "...kkaaaaaakk...",
      ...BODY,
    ],
  },
  {
    id: "dragon", name: "Dragon", tag: "New",
    palette: { a: "#b98bff", b: "#7a5cc9", c: "#d9c4ff", d: "#5a3b8f", w: W, k: K, p: P },
    grid: [
      "kck..........kck",
      ".kck........kck.",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kaaddddddddaak.",
      ".kaadkddddkdaak.",
      "..kaadwdwdwaak..",
      ...BODY,
    ],
  },
  {
    id: "panda", name: "Panda", tag: "New",
    palette: { a: "#f4f0e8", b: "#2b2b2b", c: "#ffffff", d: "#2b2b2b", w: "#ffffff", k: K, p: P },
    grid: [
      "..kkk......kkk..",
      ".kbbbk....kbbbk.",
      ".kbbbkkkkkkbbbk.",
      "..kaaaaaaaaaak..",
      ".kbbwwkaaakwwbk.",
      ".kbbwwkaaakwwbk.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaakkaaaaak.",
      ".kpaaaaaaaaaapk.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "wolf", name: "Wolf", tag: "New",
    palette: { a: "#7a8290", b: "#4a5260", c: "#a8b0bf", d: "#3a4048", w: W, k: K, p: P },
    grid: [
      ".kk..........kk.",
      "kbak........kabk",
      "kbaak......kaabk",
      ".kaaakkkkkkaaak.",
      "..kaaaaaaaaaak..",
      ".kcwwkaaaakwwck.",
      ".kawwkaaaakwwak.",
      ".kaaaaddddaaaak.",
      ".kpaaadkkdaaapk.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "shark", name: "Shark", tag: "New",
    palette: { a: "#7fa8c4", b: "#4a7a99", c: "#b8d8e8", d: "#f4f0e8", w: W, k: K, p: P },
    grid: [
      "......kck.......",
      ".....kcck.......",
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      EYES, EYES,
      ".kaaaaaaaaaaaak.",
      ".kakkkkkkkkkkak.",
      ".kakwkwkwkwkkak.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "astronaut", name: "Astronaut", tag: "New",
    palette: { a: "#f4f0e8", b: "#b8c0cc", c: "#8fd8f5", d: "#2b3340", w: W, k: K, p: P },
    grid: [
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      ".kaddddddddddak.",
      ".kadcddddddddak.",
      ".kadwwddddwwdak.",
      ".kadwwddddwwdak.",
      ".kaddddddddddak.",
      ".kaaaaaaaaaaaak.",
      ".kaakkkkkkkkaak.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
  {
    id: "ninja", name: "Ninja", tag: "New",
    palette: { a: "#2b3340", b: "#1a1f28", c: "#4a5260", d: "#e3b287", w: W, k: K, p: P },
    grid: [
      "..kkkkkkkkkkkk..",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kdwwkaaaakwwdk.",
      ".kdaaaaaaaaaadk.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      "..kaaaaaaaaaak..",
      ...BODY,
    ],
  },
];

export const AVATAR_BY_ID = AVATARS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<AvatarId, AvatarDef>,
);

export function AvatarSprite({ id, className }: { id: AvatarId; className?: string }) {
  const def = AVATAR_BY_ID[id] ?? AVATARS[0];
  return (
    <svg
      viewBox="0 0 16 16"
      className={className ?? "avatar-sprite"}
      shapeRendering="crispEdges"
      role="img"
      aria-label={def.name}
    >
      {/* Must match the grid: left at 10 this covered only the top-left of every sprite. */}
      <rect x="0" y="0" width="16" height="16" fill="rgba(0,0,0,0.25)" />
      {def.grid.flatMap((row, y) =>
        row.split("").map((ch, x) => {
          const fill = def.palette[ch];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
        }),
      )}
    </svg>
  );
}

export { OUTLINE, EYE };
