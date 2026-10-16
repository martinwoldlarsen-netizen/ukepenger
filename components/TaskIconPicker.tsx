"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TaskIcon } from "@/components/TaskIcon";
import { TASK_ART_LABELS } from "@/components/task-art";
import { TASK_EMOJI_CHOICES } from "@/lib/task-emoji";
import { cx, focusRing } from "@/components/ui";

// Velg bilde for en oppgave: «Automatisk» (gjettes ut fra navnet), et av de
// tegnede bildene eller en emoji. null = automatisk.
export function TaskIconPicker({ title, value, onChange }: { title: string; value: string | null; onChange: (icon: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const option = (icon: string | null, label: string) => {
    const selected = value === icon;
    return (
      <button
        key={icon ?? "auto"}
        type="button"
        onClick={() => {
          onChange(icon);
          setOpen(false);
        }}
        aria-label={label}
        aria-pressed={selected}
        title={label}
        className={cx("rounded-2xl p-1 transition", focusRing, selected ? "bg-primary/15 ring-2 ring-primary" : "hover:bg-black/5")}
      >
        <TaskIcon title={title} icon={icon} size={44} />
      </button>
    );
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cx("flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-left", focusRing)}
      >
        <TaskIcon title={title} icon={value} size={44} />
        <span className="flex-1 font-semibold">{value ? (TASK_ART_LABELS[value] ?? "Valgt emoji") : "Automatisk"}</span>
        <span className="text-sm text-muted-foreground">Bytt</span>
        <ChevronDown className={cx("size-4 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 space-y-3 rounded-2xl border border-border bg-card p-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Tegnede bilder</p>
            <div className="flex flex-wrap gap-1">
              {option(null, "Automatisk (ut fra navnet)")}
              {Object.entries(TASK_ART_LABELS).map(([key, label]) => option(key, label))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Emoji</p>
            <div className="flex flex-wrap gap-1">{TASK_EMOJI_CHOICES.map((e) => option(e, e))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
