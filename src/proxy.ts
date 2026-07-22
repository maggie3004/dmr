import { NextResponse } from "next/server";
import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname === "/";
  const isOnLogin = req.nextUrl.pathname.startsWith("/login");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isReports = req.nextUrl.pathname.startsWith("/reports");
  const isUsers = req.nextUrl.pathname.startsWith("/users");

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isOnLogin) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.nextUrl)
    );
  }

  // Role based protection
  const userRole = req.auth?.user?.role;

  if ((isReports || isUsers) && userRole !== "Admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
