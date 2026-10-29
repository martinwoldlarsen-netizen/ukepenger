"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { playChime, setSoundEnabled, soundEnabled } from "../_lib/celebrate";

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Lyd av/på for denne enheten (huskes i nettleseren).
export function SoundToggle({ labels = { on: "Skru på lyd", off: "Skru av lyd" } }: { labels?: { on: string; off: string } }) {
  const on = useSyncExternalStore(subscribe, soundEnabled, () => true);
  return (
    <button
      type="button"
      onClick={() => {
        setSoundEnabled(!on);
        listeners.forEach((fn) => fn());
        if (!on) playChime();
      }}
      aria-label={on ? labels.off : labels.on}
      aria-pressed={on}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-secondary"
    >
      {on ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
    </button>
  );
}
