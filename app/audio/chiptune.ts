// Chiptune generated at runtime with the Web Audio API rather than shipped
// as audio files: no assets to load, no external requests, and it matches
// the 8-bit look. Square-wave lead over a triangle bass, which is roughly
// how an NES pulse/triangle channel pair was used.

const NOTE_HZ: Record<string, number> = {
  "A2": 110.0, "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.0,
  "A3": 220.0, "B3": 246.94, "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23,
  "G4": 392.0, "A4": 440.0, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25,
};

export type Track = { lead: (string | null)[]; bass: (string | null)[]; bpm: number };

// A-minor loop: 16 steps, eighth notes. Deliberately simple and low-key —
// it plays under study games, so it should not demand attention.
export const LOBBY_TRACK: Track = {
  bpm: 128,
  lead: [
    "A4", null, "C5", "E5", "D5", null, "C5", null,
    "B4", null, "D5", "B4", "A4", null, null, null,
  ],
  bass: [
    "A2", null, "A2", null, "F3", null, "F3", null,
    "G3", null, "G3", null, "E3", null, "E3", null,
  ],
};

// Slightly busier, used inside games.
export const GAME_TRACK: Track = {
  bpm: 144,
  lead: [
    "E4", "A4", "C5", "B4", "A4", "E4", "G4", "A4",
    "F4", "A4", "D5", "C5", "B4", "G4", "E4", null,
  ],
  bass: [
    "A2", "A2", null, "A2", "F3", "F3", null, "F3",
    "D3", "D3", null, "D3", "E3", "E3", "G3", null,
  ],
};

/**
 * Look-ahead scheduler: a timer wakes periodically and schedules any notes
 * falling inside the next window. Scheduling directly off setInterval would
 * inherit timer jitter; this keeps timing on the audio clock instead.
 */
export class ChiptunePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextNoteTime = 0;
  private track: Track = LOBBY_TRACK;
  private running = false;

  private readonly lookaheadMs = 25;
  private readonly scheduleAheadSec = 0.12;

  /** Must be called from a user gesture — browsers block audio otherwise. */
  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private playNote(freq: number, time: number, kind: "lead" | "bass") {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === "lead" ? "square" : "triangle";
    osc.frequency.setValueAtTime(freq, time);

    // Short percussive envelope so notes read as blips, not held pads.
    const peak = kind === "lead" ? 0.16 : 0.22;
    const dur = kind === "lead" ? 0.14 : 0.2;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private tick = () => {
    const ctx = this.ctx;
    if (!ctx || !this.running) return;
    const secondsPerStep = 60 / this.track.bpm / 2; // eighth notes

    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadSec) {
      const i = this.step % this.track.lead.length;
      const lead = this.track.lead[i];
      const bass = this.track.bass[i];
      if (lead && NOTE_HZ[lead]) this.playNote(NOTE_HZ[lead], this.nextNoteTime, "lead");
      if (bass && NOTE_HZ[bass]) this.playNote(NOTE_HZ[bass], this.nextNoteTime, "bass");
      this.nextNoteTime += secondsPerStep;
      this.step += 1;
    }
  };

  setTrack(track: Track) {
    if (this.track === track) return;
    this.track = track;
    this.step = 0;
  }

  start(track?: Track) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (track) this.setTrack(track);
    void ctx.resume();
    if (this.running) return;
    this.running = true;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.timer = window.setInterval(this.tick, this.lookaheadMs);
  }

  stop() {
    this.running = false;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Ramped rather than switched, so muting does not click. */
  setVolume(value: number) {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.12);
  }

  /** One-off UI blip; independent of whether the music loop is running. */
  blip(freq: number, kind: "lead" | "bass" = "lead") {
    const ctx = this.ensureContext();
    if (!ctx) return;
    void ctx.resume();
    this.playNote(freq, ctx.currentTime + 0.01, kind);
  }
}

export const SFX = {
  select: 660,
  confirm: 880,
  correct: 988,
  wrong: 165,
};
