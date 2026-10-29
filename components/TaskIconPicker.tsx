"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TaskIcon } from "@/components/TaskIcon";
import { TASK_ART_LABELS } from "@/components/task-art";
import { TASK_EMOJI_CHOICES } from "@/lib/task-emoji";
import { cx, focusRing } from "@/components/ui";
import { useText } from "@/lib/use-lang";

const TEXT = {
  nb: { auto: "Automatisk", autoLong: "Automatisk (ut fra navnet)", emoji: "Valgt emoji", change: "Bytt", drawn: "Tegnede bilder", emojis: "Emoji", labels: {} as Record<string, string> },
  en: {
    auto: "Automatic", autoLong: "Automatic (from the name)", emoji: "Chosen emoji", change: "Change", drawn: "Drawn pictures", emojis: "Emoji",
    labels: {
      "dekke-bordet": "Set the table", "rydde-bordet": "Clear the table", "torke-bord": "Wipe the table", oppvaskmaskin: "Dishwasher", oppvask: "Dishes", matpakke: "Packed lunch",
      "lage-mat": "Cooking", leker: "Toys", "rydde-rommet": "Tidy your room", "rydde-etter-seg": "Clean up after yourself", gangen: "Hallway", seng: "Make the bed",
      stovsuger: "Vacuum", feie: "Sweep", vindu: "Windows", soppel: "Rubbish", pant: "Bottle deposit", klaer: "Clothes", brette: "Fold clothes", sko: "Shoes", hund: "Dog",
      "mate-dyr": "Feed pets", lekser: "Homework", bok: "Reading", musikk: "Practice", sekk: "Bag", tannborste: "Brushing teeth", bad: "Bathroom", sno: "Snow",
      rake: "Rake leaves", gressklipper: "Mow the lawn", bil: "Car", vannkanne: "Watering", handlepose: "Shopping", salg: "Sale",
    } as Record<string, string>,
  },
  uk: {
    auto: "Автоматично", autoLong: "Автоматично (за назвою)", emoji: "Обраний емодзі", change: "Змінити", drawn: "Малюнки", emojis: "Емодзі",
    labels: {
      "dekke-bordet": "Накрити на стіл", "rydde-bordet": "Прибрати зі столу", "torke-bord": "Витерти стіл", oppvaskmaskin: "Посудомийка", oppvask: "Посуд", matpakke: "Їжа з собою",
      "lage-mat": "Готування", leker: "Іграшки", "rydde-rommet": "Прибрати в кімнаті", "rydde-etter-seg": "Прибрати за собою", gangen: "Передпокій", seng: "Застелити ліжко",
      stovsuger: "Пилосос", feie: "Підмести", vindu: "Вікна", soppel: "Сміття", pant: "Пляшки", klaer: "Одяг", brette: "Скласти одяг", sko: "Взуття", hund: "Собака",
      "mate-dyr": "Нагодувати тварин", lekser: "Уроки", bok: "Читання", musikk: "Музика", sekk: "Рюкзак", tannborste: "Чистити зуби", bad: "Ванна", sno: "Сніг",
      rake: "Згребти листя", gressklipper: "Газон", bil: "Машина", vannkanne: "Полив", handlepose: "Покупки", salg: "Продаж",
    } as Record<string, string>,
  },
};

// Velg bilde for en oppgave: «Automatisk» (gjettes ut fra navnet), et av de
// tegnede bildene eller en emoji. null = automatisk.
export function TaskIconPicker({ title, value, onChange }: { title: string; value: string | null; onChange: (icon: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const t = useText(TEXT);
  const label = (key: string) => t.labels[key] ?? TASK_ART_LABELS[key] ?? key;
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
        <span className="flex-1 font-semibold">{value ? (TASK_ART_LABELS[value] ? label(value) : t.emoji) : t.auto}</span>
        <span className="text-sm text-muted-foreground">{t.change}</span>
        <ChevronDown className={cx("size-4 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 space-y-3 rounded-2xl border border-border bg-card p-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t.drawn}</p>
            <div className="flex flex-wrap gap-1">
              {option(null, t.autoLong)}
              {Object.keys(TASK_ART_LABELS).map((key) => option(key, label(key)))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t.emojis}</p>
            <div className="flex flex-wrap gap-1">{TASK_EMOJI_CHOICES.map((e) => option(e, e))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
