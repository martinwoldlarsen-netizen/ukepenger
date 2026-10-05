import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { KIOSK_COOKIE_NAME } from "@/lib/device-session.edge";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const kioskCookie = req.cookies.get(KIOSK_COOKIE_NAME)?.value;

  if (pathname.startsWith("/admin/beta")) {
    if (process.env.NEXT_PUBLIC_BETA_FAMILY !== "true") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/inbox";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/kiosk" || pathname.startsWith("/kiosk/claim") || pathname.startsWith("/api/kids")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/kids")) {
    if (kioskCookie) {
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.pathname = "/kiosk";
    return NextResponse.redirect(url);
  }

  if (pathname !== "/" && pathname !== "/login" && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Besteforeldre som har lagt Ukepenger på hjemskjermen starter på "/"
  // (manifestets start_url). Send dem rett til sin egen side.
  // Innloggingslenker (e-postbekreftelse/OAuth) som lander på forsiden med en
  // kode, sendes videre til callback-siden som fullfører innloggingen.
  if (pathname === "/" && req.nextUrl.searchParams.has("code")) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Åpnet fra hjemskjermen (manifestets start_url): rett til riktig sted.
  const fromApp = pathname === "/" && req.nextUrl.searchParams.get("app") === "1";
  if (fromApp && kioskCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/kids";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && req.cookies.get("uk_guest")?.value && !kioskCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/besteforeldre";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Leser (og fornyer ved behov) innloggingen. Fornyede cookies settes av
  // serveren, så Safari lar dem leve lenge i stedet for 7 dager.
  const { data } = await supabase.auth.getSession();

  // Innlogget forelder som åpner appen eller /login: rett inn. Forsiden
  // (ukepenger.no) vises ellers alltid, med «Gå til appen» i menyen.
  if (data.session && (fromApp || pathname === "/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/inbox";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    res.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (fromApp) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/kids/:path*", "/kiosk", "/kiosk/claim", "/api/kids/:path*", "/admin/beta/:path*"],
};
