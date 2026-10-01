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

export default function AdminInboxPage() {
  const toast = useToast();
  const confirm = useConfirm();
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
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å angre.") });
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
          text: status === "APPROVED" ? `Godkjent: ${taskTitleOf(claim)} til ${child.name}` : `Avvist: ${taskTitleOf(claim)}`,
          action: { label: "Angre", onClick: () => void undo(claim) },
        });
      },
      (error) => toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre. Prøv igjen.") })
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
      title: `Godkjenne alle ${claimList.length}?`,
      text: `Til sammen ${formatKr(totalOre)} blir lagt til det barna har til gode.`,
      confirmLabel: "Godkjenn alle",
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
      toast({ text: `${ids.length} krav godkjent` });
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
      toast({ kind: "error", text: `Sett en pris på «${wish.title}» først.` });
      return;
    }
    if (action === "decline") {
      const ok = await confirm({ title: `Avvise «${wish.title}»?`, text: `${child.name} ser at ønsket ikke ble godkjent.`, confirmLabel: "Avvis", danger: true });
      if (!ok) return;
    }

    setBusy((prev) => ({ ...prev, [wish.id]: true }));
    try {
      const payload = await adminFetch<{ result?: string }>("/api/admin/wishlist/review", {
        method: "POST",
        body: JSON.stringify({ id: wish.id, action, targetOre }),
      });
      if (payload.result === "PAID") toast({ text: `Utbetalt som ønske: ${wish.title}` });
      else if (payload.result === "SAVING") toast({ text: `${wish.title} er nå et sparemål for ${child.name}` });
      else toast({ text: `Ønsket «${wish.title}» er avvist` });
      await wishes.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å behandle ønsket.") });
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
              <p className="text-sm font-semibold opacity-80">Til godkjenning</p>
              <p className="font-num mt-1 text-4xl font-bold tracking-tight">
                {claimList.length + wishList.length}
                <span className="ml-2 font-sans text-lg font-semibold opacity-80">venter</span>
              </p>
              {claimList.length > 0 && <p className="mt-1 text-sm opacity-80">Oppgaver for til sammen {formatKr(totalOre)}</p>}
            </div>
            {claimList.length > 1 && (
              <Button variant="secondary" onClick={() => void approveAll()} icon={<Check className="size-4" />} className="border-transparent">
                Godkjenn alle
              </Button>
            )}
          </div>
        )}
      </div>

      {loading && <ListSkeleton rows={3} />}

      {nothing && (
        <EmptyState emoji="🎉" title="Alt er godkjent">
          Når barna trykker «Jeg har gjort det!», dukker det opp her.
        </EmptyState>
      )}

      {/* Ønsker */}
      {wishList.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Gift className="size-5 text-amber-700" /> Ønsker
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
                      {child.name} ønsker seg · {formatWhen(wish.created_at)}
                    </p>
                    <p className="mt-0.5 text-xl font-bold leading-snug tracking-tight">{wish.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {wish.status === "ACTIVE" ? <Badge tone="success">Har spart nok</Badge> : <Badge tone="warning">Nytt ønske</Badge>}
                      <Badge>Til gode {formatKr(wish.balance_ore)}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  {wish.status === "PROPOSED" ? (
                    <label className="w-36">
                      <span className="mb-1.5 block text-sm font-semibold">Pris</span>
                      <span className="relative block">
                        <Input
                          value={wishPrices[wish.id] ?? (wish.suggested_ore ? String(wish.suggested_ore / 100) : "")}
                          onChange={(e) => setWishPrices((prev) => ({ ...prev, [wish.id]: e.target.value }))}
                          inputMode="decimal"
                          placeholder="49"
                          className="pr-10"
                          aria-label={`Pris for ${wish.title}`}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                      </span>
                    </label>
                  ) : (
                    <p className="font-num text-2xl font-bold">{formatKr(price)}</p>
                  )}
                  <p className="min-w-0 flex-1 pb-3 text-sm text-muted-foreground">
                    {price <= 0
                      ? "Sett en pris for å godkjenne."
                      : enough
                        ? "Utbetales med en gang og trekkes fra det barnet har til gode."
                        : "For lite til gode ennå, så det blir et sparemål."}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    loading={busy[wish.id]}
                    onClick={() => void reviewWish(wish, wish.status === "ACTIVE" ? "payout" : "approve")}
                    icon={<Check className="size-4" />}
                  >
                    {wish.status === "ACTIVE" ? "Utbetal ønsket" : "Godkjenn"}
                  </Button>
                  <Button variant="dangerSoft" disabled={busy[wish.id]} onClick={() => void reviewWish(wish, "decline")}>
                    Avvis
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
          {wishList.length > 0 && <h3 className="text-lg font-bold tracking-tight">Oppgaver</h3>}
          <ul className="space-y-3">
            {claimList.map((claim) => {
              const child = childOf(claim.child_id);
              const title = taskTitleOf(claim);
              return (
                <li key={claim.id} className="animate-pop flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:gap-4 sm:p-5">
                  <Avatar avatarKey={child.avatar_key} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-muted-foreground">
                      {child.name} · {formatWhen(claim.created_at)}
                    </p>
                    <p className="truncate text-lg font-bold leading-snug tracking-tight">{title}</p>
                    <p className="font-num text-xl font-bold text-primary">{formatKr(claim.amount_ore)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <IconButton label={`Avvis ${title}`} variant="dangerSoft" disabled={busy[claim.id]} onClick={() => void decide(claim, "REJECTED")}>
                      <X className="size-5" strokeWidth={2.5} />
                    </IconButton>
                    <IconButton label={`Godkjenn ${title}`} variant="primary" disabled={busy[claim.id]} onClick={() => void decide(claim, "APPROVED")}>
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
        <EmptyState emoji="😕" title="Klarte ikke å hente krav">
          <Button variant="secondary" className="mt-3" onClick={() => void claims.mutate()}>
            Prøv igjen
          </Button>
        </EmptyState>
      )}

      {!loading && claimList.length === 0 && wishList.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <PartyPopper className="size-4" /> Ingen oppgaver venter.
        </p>
      )}
    </section>
  );
}
