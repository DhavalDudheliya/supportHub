import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - static files (.svg, .png, .jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[^/]+$).*)",
  ],
};

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // Get hostname of request (e.g. acmecorp.supporthub.com, acmecorp.localhost:3000)
  let hostname = req.headers
    .get("host")!
    .replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  // Special case for Vercel preview deployments
  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${
      process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // ── Root domain (e.g., localhost:3000 or supporthub.com) ──
  if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return NextResponse.next();
  }

  // ── Subdomain routing (e.g., acmecorp.localhost:3000) ──
  const currentHost =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
      ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
      : hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "");

  if (!currentHost || currentHost === hostname) {
    return NextResponse.next();
  }

  // ── Server-side auth guard ──
  const token = req.cookies.get("supporthub_access_token")?.value;

  const isProtectedRoute =
    pathname.includes("/dashboard") ||
    pathname.includes("/tickets") ||
    pathname.includes("/customers") ||
    pathname.includes("/reporting") ||
    pathname.includes("/settings");

  const isAuthRoute =
    pathname.includes("/login") || pathname.includes("/register");

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL(`/login`, req.url);
    loginUrl.searchParams.set("subdomain", currentHost);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && token) {
    const dashUrl = new URL(`/dashboard`, req.url);
    dashUrl.searchParams.set("subdomain", currentHost);
    return NextResponse.redirect(dashUrl);
  }

  // ── Rewrite to tenant routing folder ──
  const rewriteUrl = new URL(`/tenant${path}`, req.url);
  rewriteUrl.searchParams.set("subdomain", currentHost);

  return NextResponse.rewrite(rewriteUrl);
}
