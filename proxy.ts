import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { defaultLocale, isLocale, localeCookie, type Locale } from "@/lib/i18n/config";

function preferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(localeCookie)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: (tag ?? "").toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

async function protectAdmin(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = request.nextUrl.pathname.startsWith("/admin/login");

  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    return NextResponse.redirect(login);
  }

  if (user && isLogin) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/admin";
    dashboard.search = "";
    return NextResponse.redirect(dashboard);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return protectAdmin(request);
  }

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    // Remember an explicit language choice for the next visit to "/".
    const response = NextResponse.next();
    if (request.cookies.get(localeCookie)?.value !== first) {
      response.cookies.set(localeCookie, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return response;
  }

  // No locale in the URL: send the visitor to their language.
  const target = request.nextUrl.clone();
  target.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(target);
}

export const config = {
  // Everything except API routes, Next internals, metadata routes and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|sitemap.xml|robots.txt|.*\\..*).*)"],
};
