"use client";

import PixelTileIcon from "../PixelTileIcon";
import DailyChallenge from "../daily/DailyChallenge";
import { LABS } from "./labs";
import { useSound } from "../audio/SoundProvider";

export default function ArcadePanel() {
  const { playSfx } = useSound();

  return (
    <div className="hub-panel">
      <DailyChallenge />

      <section className="section">
        <h2>Choose your lab</h2>
        <div className="lab-link-list">
          {LABS.map((lab) => (
            <a
              href={lab.href}
              className="lab-link-row"
              key={lab.href}
              onMouseEnter={() => playSfx("select")}
              onClick={() => playSfx("confirm")}
            >
              <span className="teaser-tile-icon" aria-hidden="true">
                <PixelTileIcon kind={lab.icon} />
              </span>
              <span className="teaser-tile-tag">{lab.tag}</span>
              <span className="teaser-tile-title">{lab.title}</span>
              <span className="teaser-tile-desc">{lab.desc}</span>
              <span className="teaser-tile-cta">Play &rarr;</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
