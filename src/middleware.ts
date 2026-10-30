import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// ============================================================================
// TEMPORARY AUTH BYPASS CONFIGURATION
// When set to `true`:
// - Anyone visiting the site (root '/', '/login', '/signup', etc.) is seamlessly
//   and immediately routed to the dashboard (`/app/demo-corp/overview`).
// - All workspace routes (`/app/*`) are completely accessible with zero login prompt.
// - Demo session cookies are set automatically so all workspace features work seamlessly.
// - ZERO login code, forms, or pages are deleted.
// - To restore the standard login & authentication flow at any time, simply set this to `false`.
// ============================================================================
export const TEMPORARY_BYPASS_AUTH = false;

export async function middleware(request: NextRequest) {
  // Legacy /app/acme-corp/* forwarder to /app/demo-corp/*
  if (request.nextUrl.pathname.startsWith("/app/acme-corp")) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.replace("/app/acme-corp", "/app/demo-corp");
    return NextResponse.redirect(url);
  }

  // --------------------------------------------------------------------------
  // 1. TEMPORARY AUTH BYPASS (Active when testing online without login)
  // --------------------------------------------------------------------------
  if (TEMPORARY_BYPASS_AUTH) {
    const isAuthRoute =
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup") ||
      request.nextUrl.pathname.startsWith("/reset-password");

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/demo-corp/overview";
      const redirectResponse = NextResponse.redirect(url);

      // Inject active session cookies for smooth seamless access
      redirectResponse.cookies.set("roos_session", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });
      redirectResponse.cookies.set("roos_user_role", "owner", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
      return redirectResponse;
    }

    // For all dashboard/app routes, allow immediate access and ensure session cookie exists
    const response = NextResponse.next();
    if (!request.cookies.get("roos_session")) {
      response.cookies.set("roos_session", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
      response.cookies.set("roos_user_role", "owner", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }
    return response;
  }

  // --------------------------------------------------------------------------
  // 2. STANDARD AUTHENTICATION LOGIC (Active when TEMPORARY_BYPASS_AUTH = false)
  // --------------------------------------------------------------------------
  // Immediately redirect root / to /login
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check demo session cookie for instant seamless access
  const demoSession = request.cookies.get("roos_session")?.value;
  const isDemoAuthenticated = demoSession === "true" || demoSession === "admin";

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/reset-password");

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/app") ||
    request.nextUrl.pathname.startsWith("/select-org");

  // Allow auth routes (/login, /signup, etc.) to always render cleanly
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // If user is authenticated via demo session, allow immediate access to protected routes
  if (isDemoAuthenticated && isProtectedRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured yet (local dev mode preview), allow routing without crashing
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users trying to access protected workspace routes
  if (isProtectedRoute && !user && !isDemoAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
