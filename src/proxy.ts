import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_PATHS = ["/sign-in"];

const PROTECTED_PATHS = [
  "/applications",
  "/outreach",
  "/targets",
  "/email-finder",
  "/templates",
  "/profile",
  "/settings",
  "/onboarding",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internal assets and static files
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow Better Auth endpoints
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const session = getSessionCookie(request);

  // Match exact paths and their nested routes
  const matchesPath = (paths: string[]) =>
    paths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

  const isAuthPath = matchesPath(AUTH_PATHS);
  const isProtectedPath = matchesPath(PROTECTED_PATHS);

  // Redirect users with a session cookie away from sign-in
  if (session && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect guests away from protected pages
  if (!session && isProtectedPath) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackURL", pathname);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
