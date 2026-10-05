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

  if (pathname !== "/") {
    return NextResponse.next();
  }

  // Besteforeldre som har lagt Ukepenger på hjemskjermen starter på "/"
  // (manifestets start_url). Send dem rett til sin egen side.
  if (req.cookies.get("uk_guest")?.value && !kioskCookie) {
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

  const { data } = await supabase.auth.getSession();

  if (data.session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/inbox";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/", "/kids/:path*", "/kiosk", "/kiosk/claim", "/api/kids/:path*", "/admin/beta/:path*"],
};
