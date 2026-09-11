# Ukepenger – mobilapp (Expo / React Native)

Ny app, bygget fra bunnen i Expo/React Native. Gjenbruker samme
Supabase-backend (prosjekt `axvycqafiprmzmwwlgdd`, eu-west-1) som
nettappen i repoets rot – ingen ny database, RLS eller innlogging.

## Oppsett

```bash
cd mobile
npm install
cp .env.example .env   # fyll inn EXPO_PUBLIC_SUPABASE_ANON_KEY (anon key, ikke hemmelig)
```

## Kjøre appen

```bash
npx expo start --tunnel
```

**NB:** `--tunnel` bruker ngrok, og ngrok sin TLS (cert-pinning) blir
blokkert av dette miljøets utgående proxy (bekreftet: CONNECT går
gjennom, men TLS-handshaken feiler med "no application protocol").
Dette er en kjent begrensning i sandkasse-miljøet dette prosjektet
utvikles i (Claude Code på nett), ikke noe galt med selve Expo-oppsettet.

Alternativer for å teste på en iPhone uten Mac/PC:
- Kjør `npx expo start --tunnel` fra en maskin/økt som ikke går via en
  slik proxy (f.eks. GitHub Codespaces, en annen skytjeneste, eller en
  økt der nettverkspolicyen faktisk slipper gjennom ngrok sin TLS).
- Bruk **EAS Update** i stedet for en live dev-tunnel: `eas update`
  bruker vanlige HTTPS-kall (ikke WebSocket/cert-pinning) mot
  `expo.dev`/`u.expo.dev`, som er bekreftet nåbare herfra. Brukeren
  scanner en QR-kode i Expo Go som peker til den publiserte bunten.
  Krever et gratis Expo-konto og `eas init`/`eas update:configure`.

## Status – milepæl 1

- [x] Tomt Expo-prosjekt (`mobile/`)
- [x] Supabase-klient satt opp med samme prosjekt som nettappen
- [x] Innlogging med e-post/passord mot Supabase Auth
- [x] Viser liste over barn (`children`-tabellen) for innlogget families
      `family_id`
- [ ] Tunnel + QR-kode + kjøring på ekte iPhone via Expo Go – blokkert av
      nettverksmiljøet, se over
