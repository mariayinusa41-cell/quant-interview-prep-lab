// Pixel avatars, drawn as 10x10 character grids so they stay editable by
// hand. Each key maps into that avatar's own palette; "." is transparent.
// Same crispEdges/SVG approach as TokenIcon so everything matches.

export type AvatarId =
  | "duck"
  | "frog"
  | "bird"
  | "pig"
  | "monster"
  | "princess"
  | "cat"
  | "robot";

type AvatarDef = {
  id: AvatarId;
  name: string;
  grid: string[];
  palette: Record<string, string>;
};

const OUTLINE = "#1a1410";
const EYE = "#1a1410";
const WHITE = "#f4f0e8";

export const AVATARS: AvatarDef[] = [
  {
    id: "duck",
    name: "Duck",
    palette: { y: "#f4c542", o: "#e8873c", k: EYE, w: WHITE, l: "#ffe28a" },
    grid: [
      "...yyyy...",
      "..yllllyy.",
      "..ywkylkw.",
      "..yllllyy.",
      "..oooyyy..",
      ".yyyyyyyy.",
      "yyllllllyy",
      "yyllllllyy",
      ".yyyyyyyy.",
      "..oo..oo..",
    ],
  },
  {
    id: "frog",
    name: "Frog",
    palette: { g: "#59c98f", d: "#2f8f60", k: EYE, w: WHITE },
    grid: [
      "..w....w..",
      ".wkw..wkw.",
      ".ggg..ggg.",
      "..gggggg..",
      ".gggggggg.",
      "gggggggggg",
      "gggkkkkggg",
      ".gggggggg.",
      "..dd..dd..",
      ".dd....dd.",
    ],
  },
  {
    id: "bird",
    name: "Bird",
    palette: { b: "#4fb3e0", d: "#2b7fb0", o: "#e8873c", k: EYE, w: WHITE },
    grid: [
      "....bbb...",
      "...bbbbb..",
      "..bwkbbbb.",
      "..bbbbbbo.",
      "...bbbbb..",
      "..bbbbbbb.",
      ".bbdddbbbb",
      ".bbdddbbb.",
      "..bbbbbb..",
      "...o..o...",
    ],
  },
  {
    id: "pig",
    name: "Pig",
    palette: { p: "#f2a3b3", d: "#d97e92", k: EYE, w: WHITE },
    grid: [
      ".pp....pp.",
      ".ppp..ppp.",
      "..pppppp..",
      ".pppppppp.",
      ".pwkppkwp.",
      ".pppppppp.",
      ".ppdddppp.",
      ".ppdkdkpp.",
      "..pppppp..",
      "..dd..dd..",
    ],
  },
  {
    id: "monster",
    name: "Monster",
    palette: { g: "#4a9d52", d: "#2f6b36", k: EYE, w: WHITE, r: "#e74c4c" },
    grid: [
      "..gg..gg..",
      ".gggggggg.",
      "gggggggggg",
      "gwkgggwkgg",
      "gggggggggg",
      "grrrrrrrrg",
      "gggggggggg",
      ".dgggggdd.",
      ".dd....dd.",
      ".dd....dd.",
    ],
  },
  {
    id: "princess",
    name: "Princess",
    palette: { s: "#7a4a2b", h: "#2a1a10", c: "#f4c542", p: "#b98bff", k: EYE, w: WHITE },
    grid: [
      "..c.c.c...",
      ".cccccccc.",
      "..hhhhhh..",
      ".hssssssh.",
      ".hswkskwh.",
      ".hssssssh.",
      "..ssssss..",
      ".pppppppp.",
      "pppppppppp",
      "pppppppppp",
    ],
  },
  {
    id: "cat",
    name: "Cat",
    palette: { a: "#8a8f98", d: "#5c6068", k: EYE, w: WHITE, o: "#e8873c" },
    grid: [
      ".aa....aa.",
      ".aaa..aaa.",
      "..aaaaaaa.",
      ".aaaaaaaaa",
      ".awkaaakwa",
      ".aaaoaaaaa",
      ".addaaadda",
      "..aaaaaaa.",
      "..aaaaaa..",
      "...a..a...",
    ],
  },
  {
    id: "robot",
    name: "Robot",
    palette: { m: "#b8c0cc", d: "#6b7480", c: "#4fb3e0", k: EYE, r: "#e74c4c" },
    grid: [
      "....r.....",
      "....d.....",
      ".mmmmmmmm.",
      ".mccmmccm.",
      ".mmmmmmmm.",
      ".mdddddmm.",
      "mmmmmmmmmm",
      "dmmmmmmmmd",
      ".mmmmmmmm.",
      ".dd....dd.",
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
      viewBox="0 0 10 10"
      className={className ?? "avatar-sprite"}
      shapeRendering="crispEdges"
      role="img"
      aria-label={def.name}
    >
      <rect x="0" y="0" width="10" height="10" fill="rgba(0,0,0,0.25)" />
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
