import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessRoute,
  getDefaultRoute,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isAuthApi) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const role = (token?.role as UserRole) ?? null;

  if (pathname === "/access-denied") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isLoginPage) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage) {
    return NextResponse.redirect(
      new URL(getDefaultRoute(role), request.url),
    );
  }

  if (role === "cashier" && pathname === "/") {
    return NextResponse.redirect(new URL("/readings", request.url));
  }

  if (role && !canAccessRoute(pathname, role)) {
    const url = new URL("/access-denied", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
