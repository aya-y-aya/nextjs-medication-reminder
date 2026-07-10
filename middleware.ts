import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-do-not-use-in-prod"
);

// Paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/register"];

// API paths excluded from session auth (they have their own auth)
const EXCLUDED_API_PATHS = ["/api/reminders/check"];

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return typeof payload.userId === "number" && typeof payload.email === "string";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Skip auth for excluded API paths (they have their own auth mechanism)
  if (EXCLUDED_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const authenticated = await isAuthenticated(request);

  // If user is authenticated and trying to access login/register, redirect to /
  if (authenticated && PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is NOT authenticated and trying to access protected pages/APIs
  if (!authenticated && !PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For pages, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
