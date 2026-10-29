"use client";

import { useState } from "react";
import { Check, Gift, PartyPopper, X } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, IconButton, Input, ListSkeleton } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import {
  type PendingClaim,
  type PendingWish,
  adminFetch,
  childLookup,
  friendlyError,
  taskTitleOf,
  useAdminIdentity,
  useChildren,
  usePendingClaims,
  usePendingWishes,
} from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { useLang, useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    undoFailed: "Klarte ikke å angre.",
    approvedToast: (task: string, name: string) => `Godkjent: ${task} til ${name}`,
    rejectedToast: (task: string) => `Avvist: ${task}`,
    undo: "Angre",
    saveFailed: "Klarte ikke å lagre. Prøv igjen.",
    approveOneTitle: "Godkjenne kravet?",
    approveAllTitle: (n: number) => `Godkjenne alle ${n}?`,
    approveAllText: (amount: string) => `Til sammen ${amount} blir lagt til det barna har til gode.`,
    approveAll: "Godkjenn alle",
    approve: "Godkjenn",
    approvedCount: (n: number) => `${n} krav godkjent`,
    setPriceFirst: (title: string) => `Sett en pris på «${title}» først.`,
    rejectWishTitle: (title: string) => `Avvise «${title}»?`,
    rejectWishText: (name: string) => `${name} ser at ønsket ikke ble godkjent.`,
    reject: "Avvis",
    paidAsWish: (title: string) => `Utbetalt som ønske: ${title}`,
    nowSavingGoal: (title: string, name: string) => `${title} er nå et sparemål for ${name}`,
    wishRejected: (title: string) => `Ønsket «${title}» er avvist`,
    wishFailed: "Klarte ikke å behandle ønsket.",
    toApprove: "Til godkjenning",
    waiting: "venter",
    tasksTotal: (amount: string) => `Oppgaver for til sammen ${amount}`,
    allDoneTitle: "Alt er godkjent",
    allDoneBody: "Når barna trykker «Jeg har gjort det!», dukker det opp her.",
    wishes: "Ønsker",
    wantsToBuy: (name: string, when: string) => `${name} vil kjøpe · ${when}`,
    wishesFor: (name: string, when: string) => `${name} ønsker seg · ${when}`,
    buyNow: "🛒 Vil kjøpe nå!",
    savedEnough: "Har spart nok",
    newWish: "Nytt ønske",
    owed: (amount: string) => `Til gode ${amount}`,
    price: "Pris",
    priceFor: (title: string) => `Pris for ${title}`,
    setPriceHint: "Sett en pris for å godkjenne.",
    paidAtOnce: "Utbetales med en gang og trekkes fra det barnet har til gode.",
    becomesGoal: "For lite til gode ennå, så det blir et sparemål.",
    payWish: "Utbetal ønsket",
    tasks: "Oppgaver",
    rejectTask: (title: string) => `Avvis ${title}`,
    approveTask: (title: string) => `Godkjenn ${title}`,
    loadFailed: "Klarte ikke å hente krav",
    tryAgain: "Prøv igjen",
    noTasksWaiting: "Ingen oppgaver venter.",
  },
  en: {
    undoFailed: "Couldn't undo.",
    approvedToast: (task: string, name: string) => `Approved: ${task} for ${name}`,
    rejectedToast: (task: string) => `Declined: ${task}`,
    undo: "Undo",
    saveFailed: "Couldn't save. Please try again.",
    approveOneTitle: "Approve the request?",
    approveAllTitle: (n: number) => `Approve all ${n}?`,
    approveAllText: (amount: string) => `In total ${amount} will be added to what the children are owed.`,
    approveAll: "Approve all",
    approve: "Approve",
    approvedCount: (n: number) => `${n} ${n === 1 ? "request" : "requests"} approved`,
    setPriceFirst: (title: string) => `Set a price for “${title}” first.`,
    rejectWishTitle: (title: string) => `Decline “${title}”?`,
    rejectWishText: (name: string) => `${name} will see that the wish wasn't approved.`,
    reject: "Decline",
    paidAsWish: (title: string) => `Paid out as a wish: ${title}`,
    nowSavingGoal: (title: string, name: string) => `${title} is now a savings goal for ${name}`,
    wishRejected: (title: string) => `The wish “${title}” was declined`,
    wishFailed: "Couldn't handle the wish.",
    toApprove: "Waiting for approval",
    waiting: "waiting",
    tasksTotal: (amount: string) => `Tasks worth ${amount} in total`,
    allDoneTitle: "All approved",
    allDoneBody: "When the children tap “I did it!”, it shows up here.",
    wishes: "Wishes",
    wantsToBuy: (name: string, when: string) => `${name} wants to buy · ${when}`,
    wishesFor: (name: string, when: string) => `${name} wishes for · ${when}`,
    buyNow: "🛒 Wants to buy now!",
    savedEnough: "Has saved enough",
    newWish: "New wish",
    owed: (amount: string) => `Owed ${amount}`,
    price: "Price",
    priceFor: (title: string) => `Price for ${title}`,
    setPriceHint: "Set a price to approve.",
    paidAtOnce: "Paid out right away and taken from what the child is owed.",
    becomesGoal: "Not enough owed yet, so it becomes a savings goal.",
    payWish: "Pay out the wish",
    tasks: "Tasks",
    rejectTask: (title: string) => `Decline ${title}`,
    approveTask: (title: string) => `Approve ${title}`,
    loadFailed: "Couldn't load requests",
    tryAgain: "Try again",
    noTasksWaiting: "No tasks waiting.",
  },
  uk: {
    undoFailed: "Не вдалося скасувати.",
    approvedToast: (task: string, name: string) => `Схвалено: ${task} — ${name}`,
    rejectedToast: (task: string) => `Відхилено: ${task}`,
    undo: "Скасувати",
    saveFailed: "Не вдалося зберегти. Спробуйте ще раз.",
    approveOneTitle: "Схвалити запит?",
    approveAllTitle: (n: number) => `Схвалити всі (${n})?`,
    approveAllText: (amount: string) => `Разом ${amount} буде додано до того, що належить дітям.`,
    approveAll: "Схвалити всі",
    approve: "Схвалити",
    approvedCount: (n: number) => `Схвалено запитів: ${n}`,
    setPriceFirst: (title: string) => `Спершу вкажіть ціну для «${title}».`,
    rejectWishTitle: (title: string) => `Відхилити «${title}»?`,
    rejectWishText: (name: string) => `${name} побачить, що бажання не схвалено.`,
    reject: "Відхилити",
    paidAsWish: (title: string) => `Виплачено як бажання: ${title}`,
    nowSavingGoal: (title: string, name: string) => `${title} тепер ціль накопичення для: ${name}`,
    wishRejected: (title: string) => `Бажання «${title}» відхилено`,
    wishFailed: "Не вдалося обробити бажання.",
    toApprove: "Очікують схвалення",
    waiting: "очікують",
    tasksTotal: (amount: string) => `Завдання на суму ${amount}`,
    allDoneTitle: "Усе схвалено",
    allDoneBody: "Коли діти натиснуть «Готово!», запит з’явиться тут.",
    wishes: "Бажання",
    wantsToBuy: (name: string, when: string) => `${name} хоче купити · ${when}`,
    wishesFor: (name: string, when: string) => `${name} бажає · ${when}`,
    buyNow: "🛒 Хоче купити зараз!",
    savedEnough: "Назбирано достатньо",
    newWish: "Нове бажання",
    owed: (amount: string) => `Належить ${amount}`,
    price: "Ціна",
    priceFor: (title: string) => `Ціна для ${title}`,
    setPriceHint: "Вкажіть ціну, щоб схвалити.",
    paidAtOnce: "Виплачується одразу й віднімається від того, що належить дитині.",
    becomesGoal: "Поки що замало, тому це стане ціллю накопичення.",
    payWish: "Виплатити бажання",
    tasks: "Завдання",
    rejectTask: (title: string) => `Відхилити ${title}`,
    approveTask: (title: string) => `Схвалити ${title}`,
    loadFailed: "Не вдалося завантажити запити",
    tryAgain: "Спробувати ще раз",
    noTasksWaiting: "Немає завдань, що очікують.",
  },
};

export default function AdminInboxPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const t = useText(TEXT);
  const lang = useLang();
  const kr = (ore: number) => formatKr(ore, lang);
  const when = (d: string) => formatWhen(d, undefined, lang);
  const { familyId, userId } = useAdminIdentity();
  const children = useChildren(familyId);
  const claims = usePendingClaims(familyId);
  const wishes = usePendingWishes(familyId);
  const childOf = childLookup(children.data);

  // Låser hvert krav mens det lagres, så dobbelttrykk ikke sender to ganger.
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [wishPrices, setWishPrices] = useState<Record<string, string>>({});

  const claimList = claims.data ?? [];
  const wishList = wishes.data ?? [];
  const totalOre = claimList.reduce((sum, c) => sum + c.amount_ore, 0);
  const loading = (claims.isLoading && !claims.data) || !familyId;

  const undo = async (claim: PendingClaim) => {
    // Tilbake til "venter": opprinnelig beløp, og sparingen nullstilles slik at
    // den trekkes riktig neste gang kravet godkjennes. Bare hvis kravet ikke er
    // utbetalt i mellomtiden.
    const res = await supabase
      .from("claims")
      .update({ status: "SENT", decided_at: null, decided_by: null, amount_ore: claim.amount_ore, saved_ore: 0, savings_applied: false })
      .eq("id", claim.id)
      .in("status", ["APPROVED", "REJECTED"]);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, t.undoFailed) });
    }
    await claims.mutate();
  };

  const decide = async (claim: PendingClaim, status: "APPROVED" | "REJECTED") => {
    if (!userId || busy[claim.id]) return;
    setBusy((prev) => ({ ...prev, [claim.id]: true }));

    // Optimistisk: fjern kortet med en gang.
    await claims.mutate(async (current) => {
      const res = await supabase
        .from("claims")
        .update({ status, decided_at: new Date().toISOString(), decided_by: userId })
        .eq("id", claim.id)
        .eq("status", "SENT");
      if (res.error) throw new Error(res.error.message);
      return (current ?? []).filter((c) => c.id !== claim.id);
    }, {
      optimisticData: (current) => (current ?? []).filter((c) => c.id !== claim.id),
      rollbackOnError: true,
      revalidate: false,
    }).then(
      () => {
        const child = childOf(claim.child_id);
        toast({
          text: status === "APPROVED" ? t.approvedToast(taskTitleOf(claim), child.name) : t.rejectedToast(taskTitleOf(claim)),
          action: { label: t.undo, onClick: () => void undo(claim) },
        });
      },
      (error) => toast({ kind: "error", text: friendlyError(error, t.saveFailed) })
    );

    setBusy((prev) => {
      const next = { ...prev };
      delete next[claim.id];
      return next;
    });
  };

  const approveAll = async () => {
    if (!userId || claimList.length === 0) return;
    const ok = await confirm({
      title: claimList.length === 1 ? t.approveOneTitle : t.approveAllTitle(claimList.length),
      text: t.approveAllText(kr(totalOre)),
      confirmLabel: claimList.length === 1 ? t.approve : t.approveAll,
    });
    if (!ok) return;
    const ids = claimList.map((c) => c.id);
    try {
      await claims.mutate(async () => {
        const res = await supabase
          .from("claims")
          .update({ status: "APPROVED", decided_at: new Date().toISOString(), decided_by: userId })
          .in("id", ids)
          .eq("status", "SENT");
        if (res.error) throw new Error(res.error.message);
        return [];
      }, { optimisticData: [], rollbackOnError: true, revalidate: true });
      toast({ text: t.approvedCount(ids.length) });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error) });
    }
  };

  const wishPriceOre = (wish: PendingWish) => {
    if (wish.status === "ACTIVE") return wish.target_ore ?? 0;
    const raw = wishPrices[wish.id] ?? (wish.suggested_ore ? String(wish.suggested_ore / 100) : "");
    const parsed = parseKrToOre(raw);
    return typeof parsed === "number" ? parsed : 0;
  };

  const reviewWish = async (wish: PendingWish, action: "approve" | "payout" | "decline") => {
    if (busy[wish.id]) return;
    const child = childOf(wish.child_id);
    const targetOre = action === "approve" ? wishPriceOre(wish) : undefined;
    if (action === "approve" && !targetOre) {
      toast({ kind: "error", text: t.setPriceFirst(wish.title) });
      return;
    }
    if (action === "decline") {
      const ok = await confirm({ title: t.rejectWishTitle(wish.title), text: t.rejectWishText(child.name), confirmLabel: t.reject, danger: true });
      if (!ok) return;
    }

    setBusy((prev) => ({ ...prev, [wish.id]: true }));
    try {
      const payload = await adminFetch<{ result?: string }>("/api/admin/wishlist/review", {
        method: "POST",
        body: JSON.stringify({ id: wish.id, action, targetOre }),
      });
      if (payload.result === "PAID") toast({ text: t.paidAsWish(wish.title) });
      else if (payload.result === "SAVING") toast({ text: t.nowSavingGoal(wish.title, child.name) });
      else toast({ text: t.wishRejected(wish.title) });
      await wishes.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.wishFailed) });
    } finally {
      setBusy((prev) => {
        const next = { ...prev };
        delete next[wish.id];
        return next;
      });
    }
  };

  const nothing = !loading && claimList.length === 0 && wishList.length === 0;

  return (
    <section className="space-y-6">
      {/* Oppsummering */}
      <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-lg">
        {loading ? (
          <div className="h-[4.5rem] animate-pulse rounded-2xl bg-primary-foreground/10" />
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold opacity-80">{t.toApprove}</p>
              <p className="font-num mt-1 text-4xl font-bold tracking-tight">
                {claimList.length + wishList.length}
                <span className="ml-2 font-sans text-lg font-semibold opacity-80">{t.waiting}</span>
              </p>
              {claimList.length > 0 && <p className="mt-1 text-sm opacity-80">{t.tasksTotal(kr(totalOre))}</p>}
            </div>
            {claimList.length > 0 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => void approveAll()}
                icon={<Check className="size-5" />}
                className="w-full border-transparent sm:w-auto"
              >
                {claimList.length === 1 ? t.approve : t.approveAll} · {kr(totalOre)}
              </Button>
            )}
          </div>
        )}
      </div>

      {loading && <ListSkeleton rows={3} />}

      {nothing && (
        <EmptyState emoji="🎉" title={t.allDoneTitle}>
          {t.allDoneBody}
        </EmptyState>
      )}

      {/* Ønsker */}
      {wishList.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Gift className="size-5 text-amber-700" /> {t.wishes}
          </h3>
          {wishList.map((wish) => {
            const child = childOf(wish.child_id);
            const price = wishPriceOre(wish);
            const enough = price > 0 && wish.balance_ore >= price;
            return (
              <Card key={wish.id} className="border-amber-200 bg-amber-50/70">
                <div className="flex items-start gap-3">
                  <Avatar avatarKey={child.avatar_key} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-muted-foreground">
                      {wish.purchase_requested_at
                        ? t.wantsToBuy(child.name, when(wish.purchase_requested_at))
                        : t.wishesFor(child.name, when(wish.created_at))}
                    </p>
                    <p className="mt-0.5 text-xl font-bold leading-snug tracking-tight">
                      {wish.emoji && <span aria-hidden="true">{wish.emoji} </span>}
                      {wish.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {wish.purchase_requested_at ? (
                        <Badge tone="primary">{t.buyNow}</Badge>
                      ) : wish.status === "ACTIVE" ? (
                        <Badge tone="success">{t.savedEnough}</Badge>
                      ) : (
                        <Badge tone="warning">{t.newWish}</Badge>
                      )}
                      <Badge>{t.owed(kr(wish.balance_ore))}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  {wish.status === "PROPOSED" ? (
                    <label className="w-36">
                      <span className="mb-1.5 block text-sm font-semibold">{t.price}</span>
                      <span className="relative block">
                        <Input
                          value={wishPrices[wish.id] ?? (wish.suggested_ore ? String(wish.suggested_ore / 100) : "")}
                          onChange={(e) => setWishPrices((prev) => ({ ...prev, [wish.id]: e.target.value }))}
                          inputMode="decimal"
                          placeholder="49"
                          className="pr-10"
                          aria-label={t.priceFor(wish.title)}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                      </span>
                    </label>
                  ) : (
                    <p className="font-num text-2xl font-bold">{kr(price)}</p>
                  )}
                  <p className="min-w-0 flex-1 pb-3 text-sm text-muted-foreground">
                    {price <= 0
                      ? t.setPriceHint
                      : enough
                        ? t.paidAtOnce
                        : t.becomesGoal}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    loading={busy[wish.id]}
                    onClick={() => void reviewWish(wish, wish.status === "ACTIVE" ? "payout" : "approve")}
                    icon={<Check className="size-4" />}
                  >
                    {wish.status === "ACTIVE" ? t.payWish : t.approve}
                  </Button>
                  <Button variant="dangerSoft" disabled={busy[wish.id]} onClick={() => void reviewWish(wish, "decline")}>
                    {t.reject}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Oppgavekrav */}
      {claimList.length > 0 && (
        <div className="space-y-3">
          {wishList.length > 0 && <h3 className="text-lg font-bold tracking-tight">{t.tasks}</h3>}
          <ul className="space-y-3">
            {claimList.map((claim) => {
              const child = childOf(claim.child_id);
              const title = taskTitleOf(claim);
              return (
                <li key={claim.id} className="animate-pop flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:gap-4 sm:p-5">
                  <Avatar avatarKey={child.avatar_key} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-muted-foreground">
                      {child.name} · {when(claim.created_at)}
                    </p>
                    <p className="truncate text-lg font-bold leading-snug tracking-tight">{title}</p>
                    <p className="font-num text-xl font-bold text-primary">{kr(claim.amount_ore)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <IconButton label={t.rejectTask(title)} variant="dangerSoft" disabled={busy[claim.id]} onClick={() => void decide(claim, "REJECTED")}>
                      <X className="size-5" strokeWidth={2.5} />
                    </IconButton>
                    <IconButton label={t.approveTask(title)} variant="primary" disabled={busy[claim.id]} onClick={() => void decide(claim, "APPROVED")}>
                      <Check className="size-5" strokeWidth={2.75} />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {claims.error && !claims.data && (
        <EmptyState emoji="😕" title={t.loadFailed}>
          <Button variant="secondary" className="mt-3" onClick={() => void claims.mutate()}>
            {t.tryAgain}
          </Button>
        </EmptyState>
      )}

      {!loading && claimList.length === 0 && wishList.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <PartyPopper className="size-4" /> {t.noTasksWaiting}
        </p>
      )}
    </section>
  );
}
