import { NextResponse } from "next/server";
import { auth } from "./auth";
import { signOut } from 'next-auth/react';

const ALLOWED_ROLES = [
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
];

export default auth(async(req) => {
  const { nextUrl } = req;

  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isLoginRoute = nextUrl.pathname === "/login";


  const isLoadingRoute = nextUrl.pathname === "/loading";
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api");

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Allow loading page publicly
  if (isLoadingRoute) {
    return NextResponse.next();
  }

  // Allow login page for unauthenticated users
  if (isLoginRoute) {
    if (isLoggedIn && role && ALLOWED_ROLES.includes(role)) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    return NextResponse.next();
  }

  // Protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Logged in but not allowed
  if (!role || !ALLOWED_ROLES.includes(role)) {
    await signOut();
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};