"use client";

// Toast-meldinger og bekreftelsesdialog. Erstatter statusmeldinger midt på
// siden og window.confirm. Brukes via useToast() og useConfirm() innenfor
// <FeedbackProvider>.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button, cx, focusRing } from "./index";

type ToastKind = "success" | "error" | "info";
type ToastInput = {
  text: string;
  kind?: ToastKind;
  action?: { label: string; onClick: () => void };
  durationMs?: number;
};
type Toast = ToastInput & { id: number };

type ConfirmInput = {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type FeedbackContextValue = {
  toast: (input: ToastInput) => void;
  confirm: (input: ConfirmInput) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useToast() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useToast må brukes innenfor FeedbackProvider");
  return ctx.toast;
}

export function useConfirm() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useConfirm må brukes innenfor FeedbackProvider");
  return ctx.confirm;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmInput & { resolve: (ok: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { ...input, id }]);
      const duration = input.durationMs ?? (input.action ? 6000 : input.kind === "error" ? 6000 : 3500);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const confirm = useCallback(
    (input: ConfirmInput) => new Promise<boolean>((resolve) => setDialog({ ...input, resolve })),
    []
  );

  const closeDialog = (ok: boolean) => {
    dialog?.resolve(ok);
    setDialog(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={cx(
              "animate-pop pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ring-1",
              t.kind === "error" ? "bg-red-50 text-red-900 ring-red-200" : "bg-foreground text-background ring-black/10"
            )}
          >
            {t.kind === "error" ? <AlertCircle className="size-5 shrink-0" /> : <CheckCircle2 className="size-5 shrink-0 text-emerald-300" />}
            <p className="min-w-0 flex-1 text-sm font-medium">{t.text}</p>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className={cx("min-h-10 rounded-xl px-3 text-sm font-bold underline-offset-4 hover:underline", focusRing)}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" aria-label="Lukk" onClick={() => dismiss(t.id)} className={cx("flex size-9 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100", focusRing)}>
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {dialog && <ConfirmDialog dialog={dialog} onClose={closeDialog} />}
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({ dialog, onClose }: { dialog: ConfirmInput; onClose: (ok: boolean) => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center" onClick={() => onClose(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="animate-pop w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-xl font-bold tracking-tight">
          {dialog.title}
        </h2>
        {dialog.text && <div className="mt-2 text-muted-foreground">{dialog.text}</div>}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => onClose(false)}>
            {dialog.cancelLabel ?? "Avbryt"}
          </Button>
          <Button ref={confirmRef} variant={dialog.danger ? "danger" : "primary"} onClick={() => onClose(true)}>
            {dialog.confirmLabel ?? "OK"}
          </Button>
        </div>
      </div>
    </div>
  );
}
