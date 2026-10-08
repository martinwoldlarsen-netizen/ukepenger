# AGENTS.md – overføring for AI-assistenter og utviklere

Les denne først. Den beskriver hva Ukepenger er, hvordan koden henger sammen,
og reglene som gjelder. Planen videre står i `VISJON.md`.

## Hva er Ukepenger

Norsk familieapp (https://www.ukepenger.no): barn gjør oppgaver og sender
krav, foreldre godkjenner og betaler ut i virkeligheten (Vipps/kontant).
Appen er et **regnskap, ikke en bank** – den flytter aldri penger.

- **Foreldre** logger inn (e-post/passord eller Google) og bruker `/admin/*`.
- **Barn** har ingen konto. En delt iPad kobles til familien med en
  engangs-QR (Mer → Enheter) og får en httpOnly-cookie `uk_kiosk`. Barnet
  velger profil hver gang på `/kids` – **bevisst ingen per-barn-cookie**.
- **Besteforeldre** får en lenke (Familie-siden) → httpOnly-cookie `uk_guest`
  → `/besteforeldre` («Se og gi»). Første gang velger de «Lag profil» eller
  «Fortsett uten». Profil = vanlig Supabase-konto uten `profiles`-rad, koblet
  via `family_guests.user_id` (kan ha flere familier). Gjeste-API-ene godtar
  både cookien og Bearer-token (`verifyGuestRequest`). Ved «Lag profil» med
  e-post legges en signert koblings-billett i kontoens `user_metadata`
  (`uk_guest_link`), så kontoen kobles ved første innlogging selv om e-posten
  bekreftes i en annen nettleser (Messenger → Safari). Se `/api/guest/me`.
- **Messenger/Facebook o.l.** (`lib/in-app-browser.ts`): Google-innlogging og
  hjemskjerm virker ikke der. `components/OpenOutsideCard.tsx` åpner siden i
  Safari/Chrome/standard-nettleser (`x-safari-https://`, `googlechromes://`,
  Android `intent://`). Besteforelder-tilgangen tas med via en kryptert
  overlevering (`/api/guest/handoff` → `/besteforeldre/koble?h=…`, 30 min).
- **Ny konto** uten familie havner på `/velkommen` («Start ny familie» /
  invitert forelder / besteforelder). Ruting etter innlogging: `lib/after-auth.ts`.
- **Vipps-gaver**: familien legger inn mottakere i `family_vipps` (navn +
  nummer, f.eks. Mamma og Pappa) på Familie-siden («Vipps for gaver»).
  `profiles.display_name`/`vipps_phone` brukes ikke lenger. Besteforelder velger mottaker, appen viser
  beløp/nummer og åpner Vipps (vanlige personer kan ikke få forhåndsutfylt
  beløp), «Jeg har sendt» → SENT-krav `🎁 Gave fra … (Vipps til …)`.

Språk i UI: norsk bokmål, enkelt og barnevennlig (4–18 år). Kommentarer i
koden er også på norsk.

## Teknologi

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4
- Supabase (Postgres + Auth), prosjekt-ref `axvycqafiprmzmwwlgdd`, region `eu-west-1`
- Vercel, prosjekt `ukepenger-app`. Merge til `main` = produksjon. PR-er får forhåndsvisning.
- SWR for datahenting i admin, `web-push` for varsler, lucide-react ikoner

## Viktige regler (fra eieren)

1. **Kiosk, auth, enheter, proxy/middleware og databasestruktur fungerer og
   skal ikke bygges om uten en god grunn og en plan.** Ingen store refaktoreringer.
2. Ingen per-barn-cookie: barnet velger profil hver gang.
3. Barnepsykologi: progresjon, egne mål, umiddelbar positiv feedback, merker
   og «uker på rad» uten tap/straff. **Ikke** tilfeldige belønninger/lootbox,
   rangering mellom søsken, mas/push til barn eller falsk hast. Ekte kroner,
   ingen virtuell valuta.
4. Mobil først – alt skal være like lett på mobil som PC.
5. Aldri slett oppgaver med `delete`: `claims.task_id` har `on delete cascade`,
   så det ville slettet barnas historikk og penger. «Slett» = arkiver
   (`tasks.archived_at` + `active=false`).

## Kjøre lokalt

```bash
npm install
# lag .env.local med variablene under
npm run dev                  # http://localhost:3000
npx tsc --noEmit -p .        # typesjekk
npx eslint app lib components --quiet
npm run build
```

Miljøvariabler (ligger i Vercel – **aldri** commit hemmeligheter):

| Variabel | Hvor | Merknad |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | klient + server | offentlig |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | klient + server | offentlig (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | bare server, bare Production | hemmelig. Kiosk-, gjest- og varsel-API-ene trenger den, så de virker bare i produksjon |
| `RESEND_API_KEY` | server | mangler i dag → invitasjoner sendes ikke på e-post |

VAPID-nøkler for varsler lages av serveren selv og lagres i tabellen
`app_secrets` (bare service role).

## Mappestruktur

```
app/
  page.tsx, _components/LandingClient.tsx   forsiden
  login/, auth/callback/, onboarding/        innlogging og oppstart
  admin/                                     foreldrenes app (layout.tsx = meny)
    inbox (Krav), payments, tasks, children/[id], trophies, history,
    family (foreldre + besteforeldre), devices (QR/enheter), settings
  kids/                                      barnesiden (kiosk): /kids, /kids/[childId], /kids/[childId]/onsker
  kiosk/claim/route.ts                       bruker engangs-QR → setter uk_kiosk
  besteforeldre/                             gjestesiden
  personvern/, personvern/barn/, vilkar/     juridiske sider (felles mal: app/_components/LegalPage.tsx)
  api/kids/*      kiosk-API (verifyKioskRequest), sjekker alltid at barnet tilhører familien
  api/admin/*     foreldre-API (verifyAdminApiRequest med Bearer-token)
  api/guest/*     besteforeldre-API (verifyGuestRequest)
lib/
  supabaseClient.ts   nettleserklient (@supabase/ssr, innlogging i cookies)
  server-supabase.ts  service-role-klient (bare server)
  kiosk-auth.ts, guest-auth.ts, admin-api-auth.ts   autentisering per rolle
  admin-data.ts       SWR-hooks og hjelpere for admin
  progress.ts, trophies.ts   merker, uker på rad, trofeer (samme nivåliste som i databasen)
  push.ts             web-push til foreldre
  money.ts (formatKr), dates.ts (formatWhen), task-emoji.ts, task-packs.ts
components/ui/        felles UI (Button, Card, Field, Input, Switch …) + feedback.tsx (toast/confirm)
proxy.ts              Next-proxy: kiosk-ruter, forside/«app fra hjemskjerm» (?app=1), fornyer innlogging
next.config.ts        sikkerhetsheadere (CSP, Permissions-Policy osv.)
supabase/migrations/  alle databaseendringer i rekkefølge
public/sw.js          service worker (frakoblet-side + varsler)
```

## Database (viktigste tabeller)

`families`, `profiles` (forelder ↔ familie, rolle), `children`, `tasks`,
`child_task_settings`, `claims` (krav; status SENT/APPROVED/REJECTED/PAID),
`payments` + `payment_claims`, `wishlist_items`, `devices` + `device_pairings`
(engangs-QR), `family_guests`, `family_invites`, `push_subscriptions`,
`trophy_awards`, `app_secrets`, `family_vipps`.

Logikk i databasen (security definer, ikke kallbar fra klient der det ikke trengs):
- `apply_claim_savings` (trigger): trekker sparing (%) når et krav godkjennes.
- `claims_trophies` (trigger): gir trofé-/milepælsbonus én gang, rangbasert.
- `ensure_weekly_allowances(family_id)`: faste ukepenger, kalles lat fra API-ene.

`tasks.category` grupperer oppgaver (nøkler fra `lib/task-packs.ts`, null = gjettes
ut fra navnet med `categoryOf`).

Konvensjon for krav uten oppgave (`task_id` null): notat som starter med emoji
vises som det er (`🎁 Gave …`, `📅 Ukepenger`, `🏆 …`, `🏅 …`), annet notat
vises som `Bonus: …`, ingen notat = `Butikksalg`.

`profiles_guard` (trigger): klienten kan ikke endre egen `role`/`family_id`
(bare inn i en helt ny, tom familie). Invitasjoner går via service role.

RLS er på for alle tabeller og testet: en forelder i familie A ser 0 rader fra
familie B. Server-tabeller (`app_secrets`, `push_subscriptions`,
`trophy_awards`, `device_pairings`, `family_guests`) er stengt for klienten.

## Arbeidsflyt

- Lag en gren, test (typesjekk, lint, bygg), lag PR, sjekk forhåndsvisningen,
  merge til `main`. Databaseendringer legges i `supabase/migrations/` med
  dato-prefiks og kjøres i Supabase.
- Ikke legg inn hemmelige nøkler i kode, chat eller PR-er.

## Åpne punkter

Se «Åpne punkter»/«Neste steg» i `VISJON.md`. Kort: org.nr./adresse på siden,
databehandleravtaler, Apple-/Vipps-innlogging, 2FA/passkeys, rate limiting,
«Om oss», statusside, om «Salg»-knappen på profilvelgeren skal kreve godkjenning.
