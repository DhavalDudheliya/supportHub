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
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. acmecorp.supporthub.com, acmecorp.localhost:3000)
  // headers.get('host') contains the port in local dev, which we need to strip
  // for the ROOT_DOMAIN match if ROOT_DOMAIN also contains the port.
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
  // Get the path (e.g. /, /login, /dashboard)
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // If we are on the root domain (e.g., localhost:3000 or supporthub.com)
  // We serve the natural paths (e.g., /register, /login -> Find Workspace portal)
  if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return NextResponse.next();
  }

  // We are on a subdomain (e.g., acmecorp.localhost:3000)
  // Extract the subdomain piece.
  const currentHost =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
      ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
      : hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "");

  // If there is no subdomain and it somehow bypassed the root domain check above,
  // just continue normally
  if (!currentHost || currentHost === hostname) {
    return NextResponse.next();
  }

  // Rewrite to the tenant-specific routing folder, injecting the subdomain
  // e.g., acmecorp.supporthub.com/login -> app/_tenant/login/page.tsx
  // We attach the subdomain as a query param so the page can read it easily
  const rewriteUrl = new URL(`/_tenant${path}`, req.url);
  // Add subdomain to query params for easy access in server components
  rewriteUrl.searchParams.set("subdomain", currentHost);

  return NextResponse.rewrite(rewriteUrl);
}
