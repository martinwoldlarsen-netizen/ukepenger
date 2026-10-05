# Ukepenger – visjon og roadmap

Ukepenger.no er en enkel familieapp for oppgaver og ukepenger, laget først og
fremst for mobil (foreldre) og en delt iPad (barna). Det er en familieapp, ikke
en bank: appen holder regnskap over hvem som har tjent hva og hva som er betalt.
Ingen ekte penger flyttes.

> Oppgaver → krav → godkjenning → penger/saldo → utbetaling → historikk

Denne flyten skal fungere ekstremt bra. Alt annet bygges rundt den.

## Prinsipper

- **Ikke gjør det komplisert.** Ny funksjonalitet skal gjøre appen mer nyttig
  for familien og mer motiverende og lærerik for barnet, ikke tyngre.
- **Kiosk, innlogging, enheter, middleware og databasestruktur fungerer** og
  skal ikke bygges om uten en god grunn og en plan. Ingen store refaktoreringer.
- **Barna logger ikke inn.** En delt enhet kobles til familien med QR, og barnet
  velger profil hver gang. Ingen permanent innlogging eller cookie per barn.
- **Personvern:** bare fornavn og figur lagres om barnet. Ingen sporing.
- **Mobilweb først (PWA), egen app senere** hvis produktet får fotfeste.
- **Valider før vi bygger alt:** først et godt produkt for ~100 ekte familier.

## Roadmap og status

Status: ✅ ferdig · 🟡 delvis · ⬜ ikke startet

| # | Område | Status | Hva som finnes / mangler |
|---|---|---|---|
| 1 | **Hovedflyten** | 🟡 | Familie, barn, oppgaver, krav, godkjenn/avvis med store knapper og angre, «Til gode», utbetaling og historikk er ferdig. **Mangler:** varsel på forelderens mobil når et barn sender krav (i dag bare et tall på Krav i appen). |
| 2 | **Enkel onboarding** | 🟡 | Familie → barn → oppgaver → sparing → koble til iPad, med ferdige oppgavepakker. **Mangler:** «velg alder → få forslag». |
| 3 | **Barnets opplevelse (kiosk)** | 🟡 | QR-kobling, velg profil, egne oppgaver, saldo, historikk, profil og nivå. **Mangler:** valgfri PIN per barn, slik at søsken ikke kan åpne hverandres side. |
| 4 | **Avatarer og personalisering** | 🟡 | 20 egne figurer (10 søte, 10 tøffe) som barna velger selv, og profilfarge som følger figuren. **Mangler:** egne temaer og figurer som låses opp. |
| 5 | **Progresjon** | 🟡 | Nivåer (Nybegynner → Legende) etter hvor mye barnet har tjent. **Mangler:** badges, streaks og opplåsing. Bevisst lagt til senere. |
| 6 | **Historikk og pengeoversikt** | ✅ | Barnet ser «Det jeg har gjort» med tjent, spart og utbetalt. De voksne har en egen Historikk-side med filter per barn. |
| 7 | **Sparemål** | ✅ | Ønske med pris og fremdrift («420 / 849 kr»). Automatisk sparing (fast %) med sparegris. |
| 8 | **Ønskeliste** | ✅ | Barnet skriver inn ønsker selv og kan foreslå pris. Godkjennes under Krav og betales ut eller blir sparemål. |
| 9 | **Bonus** | ✅ | «+50 kr – kjempeinnsats» fra Barn-siden. |
| 10 | **Gjentakende oppgaver og automatisering** | 🟡 | Oppgaver kan gjøres om igjen, og auto-godkjenning finnes for hele familien. **Mangler:** faste ukepenger, maksbeløp per uke, regler per oppgave (f.eks. én gang om dagen), og auto-godkjenning per oppgave. |
| 11 | **Flere foreldre** | 🟡 | Familie-siden: se voksne, inviter, del lenke på nytt, trekk tilbake. Begge voksne har full tilgang. **Mangler:** e-post sendes ikke før `RESEND_API_KEY` er satt i Vercel (lenken kan deles på SMS i mellomtiden). |
| 12 | **Familieoversikt** | 🟡 | Hele familien øverst på Barn (til gode, spart, utbetalt, siste 7 dager), og Krav viser hva som venter. **Mangler:** én startside som samler barna, aktivitet og det som krever handling. |
| 13 | **Smartere oppgaver** | 🟡 | Oppgavepakker (Hjemme, Kjøkken, Ute og dyr, Skole og ansvar). **Mangler:** regler, maks per uke og frister. Henger sammen med punkt 10. |
| 14 | **Mobilweb / PWA først** | ✅ | Kan legges på hjemskjermen (manifest, ikoner, service worker, offline-side). Egen iOS/Android-app senere. |
| 15 | **100 ekte familier** | ⬜ | Produktmål. Krever lansering og enkel måte å få tilbakemelding på. |
| 16 | **Freemium** | ⬜ | Bevisst ikke startet. Alt er gratis til vi vet hva familiene faktisk bruker. |
| 17 | **Bankintegrasjon** | ⬜ | Langt frem, hvis i det hele tatt. Ukepenger skal være en familieapp, ikke fintech. |
| 18 | **Norge først, større marked senere** | ⬜ | Strategi: bevis at norske familier elsker løsningen før noe annet. |

## Neste steg (forslag i prioritert rekkefølge)

1. **Varsel til forelder** når et barn sender krav (fullfører hovedflyten, punkt 1).
2. **Faste ukepenger og maks per uke** (punkt 10/13), siden det er det appen heter.
3. **Valgfri PIN per barn** på delt iPad (punkt 3).
4. **Alder → oppgaveforslag** i onboarding (punkt 2).
5. **Startside for familien** som samler det som krever handling (punkt 12).
6. Deretter progresjon (badges, streaks, opplåsing) når familieøkonomien er
   bekreftet å fungere hos ekte familier.
