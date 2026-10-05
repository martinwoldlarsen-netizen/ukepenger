// Feiring når barnet gjør noe bra: en kort, glad lyd og litt konfetti.
// Lyden lages med Web Audio (ingen filer). Lyd kan slås av per enhet, og
// konfetti hoppes over for de som har bedt om mindre bevegelse.

const SOUND_KEY = "uk_sound";

export function soundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // privat modus: lyden følger standard (på)
  }
}

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, volume = 0.18) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// "done": kort glad melodi. "big": lengre fanfare (kjøp, nytt nivå, merke).
export function playChime(kind: "done" | "big" = "done") {
  if (!soundEnabled()) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  const notes = kind === "big" ? [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5] : [659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(ac, f, t + i * (kind === "big" ? 0.11 : 0.09), kind === "big" && i === notes.length - 1 ? 0.5 : 0.22));
}

export function confetti(amount = 80) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const g = canvas.getContext("2d");
  if (!g) {
    canvas.remove();
    return;
  }
  g.scale(dpr, dpr);
  const colors = ["#ff6b6b", "#ffd23f", "#4ecdc4", "#7b6cf6", "#2f9e5a", "#ff9f1c"];
  const w = window.innerWidth;
  const h = window.innerHeight;
  const parts = Array.from({ length: amount }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.3,
    y: h * 0.45,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 6,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    s: 6 + Math.random() * 6,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (now: number) => {
    const t = now - start;
    g.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.45;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.globalAlpha = Math.max(0, 1 - t / 1600);
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.c;
      g.fillRect(-p.s / 2, -p.s / 3, p.s, (p.s * 2) / 3);
      g.restore();
    }
    if (t < 1600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

export function celebrate(kind: "done" | "big" = "done") {
  playChime(kind);
  confetti(kind === "big" ? 160 : 70);
}
