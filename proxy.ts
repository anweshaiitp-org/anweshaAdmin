import { NextResponse } from "next/server";
import { auth } from "./auth";

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
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api");
  const publicRoutes = ["/loading", "/loadings", "/not-found", "/unauthorised", "/unauthorized", "/admin/profile"];
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Allow public pages
  if (isPublicRoute) {
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
    const response = NextResponse.redirect(new URL("/login", nextUrl));
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};