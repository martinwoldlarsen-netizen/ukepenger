"use client";

// Felles byggeklosser for appen. Alle sider bruker disse i stedet for egne
// kopier av knapper, kort, felter og meldinger, slik at alt ser likt ut og
// alle trykkflater er store nok (minst 40 px) og har synlig fokus.

import { KidAvatar } from "@/components/avatars/KidAvatar";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/* Knapp */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerSoft";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  secondary: "border border-border bg-card text-foreground hover:bg-secondary",
  ghost: "text-foreground/80 hover:bg-secondary hover:text-foreground",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  dangerSoft: "border border-red-200 bg-card text-red-700 hover:bg-red-50",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-xl px-3.5 text-sm",
  md: "min-h-11 rounded-2xl px-4 text-[15px]",
  lg: "min-h-13 rounded-2xl px-5 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, block, className, children, disabled, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        focusRing,
        buttonVariants[variant],
        buttonSizes[size],
        block && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});

/* Rund ikonknapp (f.eks. godkjenn/avvis i lister) */

export function IconButton({
  label,
  variant = "secondary",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        focusRing,
        buttonVariants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* Kort */

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "li" | "article" }) {
  return <Tag className={cx("rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6", className)}>{children}</Tag>;
}

export function CardHeader({ title, description, icon, action }: { title: ReactNode; description?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      {icon && <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">{icon}</span>}
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* Skjemafelt */

const inputBase =
  "w-full min-h-12 rounded-2xl border border-border bg-card px-4 text-base text-foreground transition placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60";

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-foreground/85">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(inputBase, className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(inputBase, "appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23526a5c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  );
});

/* Bryter (av/på) */

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-sm text-muted-foreground">{description}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-border transition peer-checked:bg-primary peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-card after:shadow after:transition peer-checked:after:translate-x-5"
      />
    </label>
  );
}

/* Merkelapp */

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-50 text-red-800",
  primary: "bg-primary text-primary-foreground",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone], className)}>{children}</span>;
}

/* Tom side */

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <div className="text-4xl" aria-hidden="true">{emoji}</div>
      <p className="mt-3 text-lg font-bold tracking-tight">{title}</p>
      {children && <div className="mt-1 text-muted-foreground">{children}</div>}
    </div>
  );
}

/* Skjelett mens data lastes */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-3xl bg-secondary", className)} aria-hidden="true" />;
}

export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cx("space-y-3", className)} role="status" aria-label="Laster">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

/* Barnets avatar i en farget sirkel */

export function Avatar({ avatarKey, size = "md" }: { avatarKey?: string | null; size?: "sm" | "md" | "lg" }) {
  const px = { sm: 36, md: 48, lg: 64 }[size];
  return <KidAvatar avatarKey={avatarKey} size={px} />;
}
