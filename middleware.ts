import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Path ላይ ያለውን Locale (lang) ማውጣት (e.g. /en/auth/login -> locale = "en")
  const pathnameSegments = pathname.split("/");
  const locale = pathnameSegments[1] || "en";

  // 2. Cookie ውስጥ ያለውን Access Token ማንበብ
  const token = req.cookies.get("transit-portal-accessToken")?.value;

  // 3. Auth Routes Check
  const isAuthPage = pathname.includes("/auth/login") || 
                     pathname.includes("/auth/signup") || 
                     pathname.includes("/auth/forgot-password");

  // 4. Protected Routes Check
  const isProtectedPage = pathname.includes("/customer/") ||
                          pathname.endsWith("/customer") ||
                          pathname.includes("/request-service");

  // Unauthenticated user ወደ Protected page ሲሄድ ወደ Login መመለስ
  if (isProtectedPage && !token) {
    const loginUrl = new URL(`/${locale}/auth/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user ወደ Auth pages ሲሄድ ወደ Customer Dashboard መመለስ
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