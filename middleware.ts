import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const pathnameSegments = pathname.split("/");
  const localeSegment = pathnameSegments[1];
  const locale = localeSegment === "am" || localeSegment === "en" ? localeSegment : "en";

  const token =
    req.cookies.get("accessToken")?.value ||
    req.cookies.get("transit-portal-accessToken")?.value ||
    req.cookies.get("MohamedTransit-portal-accessToken")?.value;

  const isAuthPage =
    pathname === `/${locale}/auth/login` ||
    pathname === `/${locale}/auth/signup` ||
    pathname === `/${locale}/auth/forgot-password` ||
    pathname.includes("/auth/login") ||
    pathname.includes("/auth/signup") ||
    pathname.includes("/auth/forgot-password");

  const isCustomerRoute =
    pathname === `/${locale}/customer` ||
    pathname.startsWith(`/${locale}/customer/`) ||
    pathname === "/customer" ||
    pathname.startsWith("/customer/");

  const isEncoderRoute =
    pathname === "/encoder" ||
    pathname.startsWith("/encoder/");

  const isAdminRoute =
    pathname === `/${locale}/admin` ||
    pathname.startsWith(`/${locale}/admin/`) ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isProtectedPage =
    isCustomerRoute ||
    isEncoderRoute ||
    isAdminRoute ||
    pathname.includes("/request-service");

  if (isProtectedPage && !token) {
    const loginUrl = new URL(`/${locale}/auth/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(`/${locale}/customer`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};