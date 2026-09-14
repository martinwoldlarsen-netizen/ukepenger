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

## Hvordan appen testes

`npx expo start --tunnel` virker **ikke** i miljøet dette utvikles i:
tunnelen går via ngrok, som bruker cert-pinning, og det bryter mot
utgående proxy (CONNECT går gjennom, TLS-handshaken feiler på ALPN).
Derfor testes appen via **EAS Update** i stedet – den publiserte bunten
lastes ned med vanlig HTTPS og kjøres i Expo Go, uten dev-server.

```bash
export EXPO_TOKEN=<access token fra expo.dev>
npx eas-cli update --branch preview --message "..." --environment preview --non-interactive
```

Kommandoen skriver ut en dashboard-URL. Åpne den på telefonen,
trykk **Preview** → **Open in Expo Go**.

Konsekvensen er at det ikke finnes live reload: hver endring krever en ny
publisering (~2 min). Får man åpnet nettverket for ngrok, er `--tunnel`
den raske veien tilbake.

### Miljøvariabler

`eas update` leser **ikke** lokal `.env` – den henter variabler fra EAS.
De ligger allerede der for `production`, `preview` og `development`:

```bash
npx eas-cli env:set --name EXPO_PUBLIC_SUPABASE_URL --value "..." \
  --visibility plaintext --environment production preview development --non-interactive
```

### Smoke-test før publisering

Siden hver publisering er dyr, kjør appen i nettleser først for å fange
krasj og renderfeil:

```bash
npx expo export --platform web
npx serve dist -l 4173
# åpne http://localhost:4173 med Playwright/Chromium og les konsollen
```

## Innlogging

Tre veier, alle mot samme Supabase-brukere som nettappen:

- **Google** – `signInWithOAuth` + `expo-web-browser`. Redirect-URL-en
  bygges av `Linking.createURL()`, og i Expo Go blir den
  `exp://u.expo.dev/<projectId>/group/<updateId>/--/auth/callback`.
  ID-en endrer seg for hver publisering, så Supabase må ha wildcard
  `exp://u.expo.dev/**` i **Authentication → URL Configuration →
  Redirect URLs**. `ukepenger://auth/callback` ligger også inne, og blir
  den gjeldende når appen en gang bygges som ekte app.
- **E-post + passord** – `signInWithPassword`.
- **Engangskode på e-post** – `signInWithOtp` / `verifyOtp`. Krever at
  `{{ .Token }}` står i Magic Link-malen under **Authentication →
  Email Templates**.

## Status

Milepæl 1 er ferdig: appen kjører på ekte iPhone i Expo Go, logger inn
med ekte konto og viser familiens barn fra `children`-tabellen.

Neste steg er skjermene for oppgaver, krav og godkjenning.

**NB:** Expo Go er kun for testing. Skal appen installeres permanent på
familiens telefoner, må den bygges og distribueres via TestFlight/App
Store, og det krever Apple Developer Program.
