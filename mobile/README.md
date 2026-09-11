# Ukepenger – mobilapp (Expo)

Native app for foreldre, bygget med Expo / React Native. Bruker samme
Supabase-backend som nettappen (`axvycqafiprmzmwwlgdd`) — ingen egen database,
RLS eller innlogging her.

## Kjøre appen

```bash
cd mobile
npm install
npx expo start --tunnel
```

Skann QR-koden med **Expo Go** på iPhone.

Supabase-URL og anon-nøkkel ligger i `app.json` under `expo.extra` (samme
offentlige nøkkel som nettappen bruker client-side — beskyttet av RLS, ikke
hemmelig).

## Status

- [x] Tomt Expo-prosjekt (TypeScript-template)
- [x] Innlogging med e-post/passord mot Supabase
- [x] Viser liste over barn for innlogget families konto
- [ ] Google-innlogging (krever native OAuth-oppsett, ikke gjort ennå)
- [ ] Resten av flyten (oppgaver, krav, godkjenning, enhetskobling for barn)

## Merk

`npx expo start --tunnel` bruker ngrok. Dette krever at miljøet du kjører
kommandoen fra har utgående tilgang til `api.ngrok.com`. Hvis tunnelen ikke
kobler til, sjekk at det ikke er en brannmur/proxy som blokkerer ngrok sine
domener.
