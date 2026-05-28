"use client";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// ── Button click — soft tick ──────────────────────────────────────────────────
export function playClick() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.06);
    gain.gain.setValueAtTime(0.18, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.08);
    vibrate(10);
  } catch {}
}

// ── Room created — success double-chime ──────────────────────────────────────
export function playRoomCreated() {
  try {
    const c = getCtx();
    [0, 0.18].forEach((delay, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(i === 0 ? 880 : 1320, c.currentTime + delay);
      gain.gain.setValueAtTime(0.25, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.3);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + 0.3);
    });
    vibrate([30, 20, 60]);
  } catch {}
}

// ── Bottle spin start — whoosh sweep ─────────────────────────────────────────
export function playBottleSpin() {
  try {
    const c = getCtx();
    const duration = 3.8;

    // Noise burst (white noise filtered)
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = c.createBufferSource();
    source.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(200, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1800, c.currentTime + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(400, c.currentTime + duration);
    filter.Q.value = 3;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, c.currentTime + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0.02, c.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start(c.currentTime);
    source.stop(c.currentTime + duration);

    // Spinning tick rhythm — accelerates then slows
    const tickCount = 24;
    for (let i = 0; i < tickCount; i++) {
      const progress = i / tickCount;
      // Fast in middle, slow at start/end — ease in-out curve
      const spacing = 0.04 + Math.sin(progress * Math.PI) * 0.25;
      const t = c.currentTime + progress * duration * 0.85 + spacing;

      const tickOsc = c.createOscillator();
      const tickGain = c.createGain();
      tickOsc.connect(tickGain);
      tickGain.connect(c.destination);
      tickOsc.type = "triangle";
      tickOsc.frequency.value = 800 + Math.random() * 200;
      tickGain.gain.setValueAtTime(0.12, t);
      tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      tickOsc.start(t);
      tickOsc.stop(t + 0.04);
    }

    vibrate([20, 30, 20, 30, 20, 60, 20, 80, 20, 120]);
  } catch {}
}

// ── Player selected — dramatic impact thud ────────────────────────────────────
export function playPlayerSelected() {
  try {
    const c = getCtx();

    // Low thud
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.3);
    gain.gain.setValueAtTime(0.5, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.35);

    // High sting on top
    const sting = c.createOscillator();
    const stingGain = c.createGain();
    sting.connect(stingGain);
    stingGain.connect(c.destination);
    sting.type = "sawtooth";
    sting.frequency.setValueAtTime(1400, c.currentTime + 0.05);
    sting.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.2);
    stingGain.gain.setValueAtTime(0.15, c.currentTime + 0.05);
    stingGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    sting.start(c.currentTime + 0.05);
    sting.stop(c.currentTime + 0.25);

    vibrate([0, 50, 100]);
  } catch {}
}

// ── Truth / Dare pick — sharp pop ────────────────────────────────────────────
export function playChoicePick() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(440, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
    vibrate(25);
  } catch {}
}

// ── Card reveal — flip whoosh ─────────────────────────────────────────────────
export function playCardReveal() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.35);
    vibrate(15);
  } catch {}
}

// ── Hurray fanfare — ascending arpeggio ──────────────────────────────────────
export function playHurray() {
  try {
    const c = getCtx();
    // C major arpeggio: C4 E4 G4 C5 E5
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    const spacing = 0.1;

    notes.forEach((freq, i) => {
      const t = c.currentTime + i * spacing;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);

      // Harmony overtone
      const osc2 = c.createOscillator();
      const gain2 = c.createGain();
      osc2.connect(gain2);
      gain2.connect(c.destination);
      osc2.type = "sine";
      osc2.frequency.value = freq * 2;
      gain2.gain.setValueAtTime(0.1, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc2.start(t);
      osc2.stop(t + 0.4);
    });

    // Final chord sustain
    [261.63, 329.63, 392.0, 523.25].forEach((freq) => {
      const t = c.currentTime + notes.length * spacing;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t);
      osc.stop(t + 1.2);
    });

    vibrate([50, 30, 50, 30, 100]);
  } catch {}
}

// ── Next turn — soft transition swoosh ───────────────────────────────────────
export function playNextTurn() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(500, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.18);
    vibrate(20);
  } catch {}
}
