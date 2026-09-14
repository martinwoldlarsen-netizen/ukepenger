import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

function parseParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");
  const segments: string[] = [];

  if (queryIndex >= 0) {
    segments.push(url.slice(queryIndex + 1, hashIndex > queryIndex ? hashIndex : url.length));
  }
  if (hashIndex >= 0) {
    segments.push(url.slice(hashIndex + 1));
  }

  for (const segment of segments) {
    for (const pair of segment.split("&")) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const key = eq === -1 ? pair : pair.slice(0, eq);
      const value = eq === -1 ? "" : pair.slice(eq + 1);
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
    }
  }

  return params;
}

async function createSessionFromUrl(url: string) {
  const params = parseParams(url);
  if (params.error_description) throw new Error(params.error_description);
  if (params.error) throw new Error(params.error);

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  throw new Error(`Fikk ingen tokens tilbake. URL: ${url.slice(0, 120)}`);
}

export function getRedirectUrl() {
  try {
    return Linking.createURL("auth/callback");
  } catch (err) {
    return err instanceof Error ? `FEIL: ${err.message}` : "FEIL: ukjent";
  }
}

export async function signInWithGoogle() {
  const redirectUrl = Linking.createURL("auth/callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Fikk ingen innloggings-URL fra Supabase.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (result.type !== "success") return null;

  return createSessionFromUrl(result.url);
}
