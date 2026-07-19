import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";


const PUBLIC_PATHS = ["/welcome", "/sign-in", "/sign-up", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if user is logged in
  const sessionCookie = getSessionCookie(request);
  
  // If user is at / and not logged in, redirect to /welcome
  if (pathname === "/" && !sessionCookie) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  // Check session for all other protected routes
  const protectedPaths = ["/", "/applications", "/email-finder", "/templates", "/profile", "/settings"];
  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/")) || pathname.startsWith("/onboarding");
  
  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
