type PixelTileKind = "chart" | "candles" | "calculator" | "target" | "search" | "bars" | "sequence" | "walk";

type PixelTileIconProps = {
  kind: PixelTileKind;
  className?: string;
};

type Pixel = { x: number; y: number; fill: string };

const BLUE = "#5eb8ff";
const GOLD = "#f4c542";
const WHITE = "#f4f0e8";
const RED = "#e74c4c";

function rect(pixels: Pixel[], x: number, y: number, width: number, height: number, fill: string) {
  for (let dy = 0; dy < height; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) pixels.push({ x: x + dx, y: y + dy, fill });
  }
}

function targetPixels(): Pixel[] {
  const pixels: Pixel[] = [];
  const centerX = 7;
  const centerY = 10;

  for (let y = 3; y < 16; y += 1) {
    for (let x = 0; x < 15; x += 1) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= 6.3) {
        const fill = distance <= 1.6 || (distance > 3.2 && distance <= 4.5) ? RED : WHITE;
        pixels.push({ x, y, fill });
      }
    }
  }

  [[14, 0], [13, 1], [12, 2], [11, 3], [10, 4], [9, 5], [8, 6], [7, 7]].forEach(([x, y]) => {
    pixels.push({ x, y, fill: BLUE });
  });
  [[14, 0], [13, 0], [14, 1], [8, 6], [7, 6], [8, 7]].forEach(([x, y]) => {
    pixels.push({ x, y, fill: GOLD });
  });

  return pixels;
}

function detailedPixels(kind: Exclude<PixelTileKind, "target">): Pixel[] {
  const pixels: Pixel[] = [];

  if (kind === "chart") {
    rect(pixels, 1, 13, 14, 2, GOLD);
    rect(pixels, 1, 2, 2, 13, GOLD);
    rect(pixels, 4, 9, 2, 4, BLUE);
    rect(pixels, 7, 6, 2, 7, BLUE);
    rect(pixels, 10, 8, 2, 5, BLUE);
    rect(pixels, 13, 4, 2, 9, BLUE);
    rect(pixels, 4, 8, 2, 1, WHITE);
    rect(pixels, 7, 5, 2, 1, WHITE);
    rect(pixels, 13, 3, 2, 1, WHITE);
    return pixels;
  }

  if (kind === "calculator") {
    rect(pixels, 2, 1, 12, 1, GOLD);
    rect(pixels, 1, 2, 1, 12, GOLD);
    rect(pixels, 14, 2, 1, 12, GOLD);
    rect(pixels, 2, 14, 12, 1, GOLD);
    rect(pixels, 3, 3, 9, 3, BLUE);
    rect(pixels, 4, 4, 5, 1, WHITE);
    [[3, 8], [6, 8], [9, 8], [3, 11], [6, 11], [9, 11]].forEach(([x, y]) => rect(pixels, x, y, 2, 2, GOLD));
    rect(pixels, 12, 8, 1, 5, BLUE);
    return pixels;
  }

  if (kind === "candles") {
    rect(pixels, 1, 13, 14, 2, GOLD);
    rect(pixels, 1, 2, 1, 13, GOLD);
    rect(pixels, 3, 5, 1, 8, BLUE);
    rect(pixels, 2, 8, 3, 3, BLUE);
    rect(pixels, 7, 2, 1, 11, RED);
    rect(pixels, 6, 4, 3, 4, RED);
    rect(pixels, 11, 6, 1, 7, BLUE);
    rect(pixels, 10, 8, 3, 4, BLUE);
    rect(pixels, 2, 8, 1, 1, WHITE);
    rect(pixels, 6, 4, 3, 1, WHITE);
    rect(pixels, 10, 8, 3, 1, WHITE);
    return pixels;
  }

  if (kind === "search") {
    const centerX = 7;
    const centerY = 7;
    for (let y = 1; y < 14; y += 1) {
      for (let x = 1; x < 14; x += 1) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance >= 4.3 && distance <= 5.7) pixels.push({ x, y, fill: BLUE });
      }
    }
    [[11, 11], [12, 12], [13, 13], [14, 14]].forEach(([x, y]) => pixels.push({ x, y, fill: GOLD }));
    return pixels;
  }

  if (kind === "bars") {
    rect(pixels, 1, 13, 14, 2, GOLD);
    rect(pixels, 1, 2, 2, 13, GOLD);
    rect(pixels, 4, 9, 3, 4, BLUE);
    rect(pixels, 8, 6, 3, 7, BLUE);
    rect(pixels, 12, 3, 3, 10, BLUE);
    rect(pixels, 4, 8, 3, 1, WHITE);
    rect(pixels, 8, 5, 3, 1, WHITE);
    rect(pixels, 12, 2, 3, 1, WHITE);
    return pixels;
  }

  if (kind === "sequence") {
    rect(pixels, 1, 4, 4, 8, BLUE);
    rect(pixels, 6, 4, 4, 8, BLUE);
    rect(pixels, 11, 4, 4, 8, BLUE);
    rect(pixels, 2, 5, 2, 1, GOLD);
    rect(pixels, 3, 6, 1, 4, GOLD);
    rect(pixels, 7, 5, 2, 1, GOLD);
    rect(pixels, 8, 6, 1, 4, GOLD);
    rect(pixels, 12, 5, 2, 1, GOLD);
    rect(pixels, 13, 6, 1, 4, GOLD);
    rect(pixels, 4, 2, 1, 2, GOLD);
    rect(pixels, 9, 2, 1, 2, GOLD);
    rect(pixels, 14, 2, 1, 2, GOLD);
    return pixels;
  }

  // Walk: a stepped path with bright nodes, used for the Markov-chain game.
  [[2, 12], [5, 9], [8, 11], [11, 6], [14, 3]].forEach(([x, y]) => rect(pixels, x, y, 2, 2, GOLD));
  rect(pixels, 3, 11, 2, 1, BLUE);
  rect(pixels, 5, 10, 2, 1, BLUE);
  rect(pixels, 7, 10, 2, 1, BLUE);
  rect(pixels, 9, 8, 2, 1, BLUE);
  rect(pixels, 11, 6, 2, 1, BLUE);
  rect(pixels, 13, 4, 2, 1, BLUE);
  rect(pixels, 13, 2, 2, 2, WHITE);
  return pixels;
}

function PixelSvg({ pixels, className }: { pixels: Pixel[]; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "pixel-tile-icon"} shapeRendering="crispEdges" aria-hidden="true">
      {pixels.map((pixel, index) => <rect key={`${pixel.x}-${pixel.y}-${index}`} x={pixel.x} y={pixel.y} width={1} height={1} fill={pixel.fill} />)}
    </svg>
  );
}

export default function PixelTileIcon({ kind, className }: PixelTileIconProps) {
  return <PixelSvg pixels={kind === "target" ? targetPixels() : detailedPixels(kind)} className={className} />;
}
