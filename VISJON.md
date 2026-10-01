# Ukepenger – visjon

Ukepenger.no er en enkel familieapp for oppgaver og ukepenger, laget først og
fremst for mobil og en delt iPad hjemme.

## Kjernen

> Oppgaver → krav → godkjenning → penger/saldo → utbetaling → historikk

Denne flyten skal fungere ekstremt bra. Alt annet bygges rundt den.

- **Barnet** ser oppgavene sine, sier fra når noe er gjort, og ser hvor mye det
  har til gode.
- **De voksne** administrerer barn og oppgaver, godkjenner eller avviser krav,
  registrerer utbetalinger og ser historikk.

## Mer enn en oppgaveliste

Appen skal gjøre det enkelt for foreldre å håndtere ukepenger, og samtidig gi
barna bedre forståelse av egne penger:

- Barnet skal forstå sammenhengen mellom å gjøre noe, tjene penger og hvor mye
  det faktisk har.
- «Til gode» skal være tydelig, sammen med hva som er tjent, hva som venter på
  godkjenning og hva som er utbetalt.
- Barnet skal få eierskap til egen økonomi og progresjon: ønsker, sparemål,
  sparing, nivåer og egen historikk.

## Barnemodus

- Barna logger ikke inn. En delt enhet kobles til familien én gang med QR:
  `QR → /kiosk/claim → kiosk-session → /kids → velg profil → /kids/[childId]`.
- Barnet velger profil hver gang. Det skal bevisst **ikke** finnes en permanent
  innlogging eller cookie per barn.

## Enkel oppstart

Opprett familie → legg til barn → få/opprett oppgaver → aktiver barnemodus →
begynn å bruke appen. Ferdige oppgavepakker skal gjøre at foreldre slipper å
finne på alt selv.

## Prinsipper

- **Ikke gjør det komplisert.** Ny funksjonalitet skal gjøre appen mer nyttig
  for familien og mer motiverende og lærerik for barnet, ikke tyngre.
- **Kiosk, innlogging, enheter, middleware og databasestruktur fungerer** og
  skal ikke bygges om uten en god grunn og en plan. Ingen store refaktoreringer.
- **Produktet etter innlogging er viktigere enn forsiden.**
- **Personvern:** bare fornavn og figur lagres om barnet. Ingen sporing.
- **Ingen ekte penger flyttes.** Ukepenger er et regnskap, ikke en lommebok.
- Gratis å bruke. «Mindre mas. Mer mestring.»

## Ønsker og status

| Ønske | Status |
|---|---|
| Tydelig «Til gode» og økonomioversikt per barn | Ferdig |
| Ønskeliste og sparemål (barna kan ønske selv) | Ferdig |
| Automatisk sparing med sparegris | Ferdig |
| Enklere utbetaling og betalingsmåte (Vipps, bank, kontant) | Ferdig |
| Avatarer, barneprofiler og motiverende barneside | Ferdig |
| Onboarding med barnemodus | Ferdig |
| Bonus | Ferdig |
| Barnets egen historikk | Ferdig |
| Historikk og familieoversikt for de voksne | Ferdig |
| Flere voksne og invitasjon av en annen forelder | Ferdig |
| Ferdige oppgavepakker | Ferdig |
