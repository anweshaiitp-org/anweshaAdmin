import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export default auth((req: NextRequest & {auth :any} )=>{
  const {nextUrl}=req;
  const isLogged = !!req.auth?.user?.email;
  const userRole=req.auth?.user?.role;
  const ALLOWED_ROLES = ["Moderator", "Admin", "SuperAdmin"];
  const isAuthRoute=nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/reset-password");
  const isApiAuthRoute=nextUrl.pathname.startsWith("/api/auth");
  if (isApiAuthRoute){
    return NextResponse.next();
  } 
  else if(isAuthRoute){
    if(isLogged && ALLOWED_ROLES.includes(userRole)){
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }
  else if(!isLogged){
    let callbackUrl=nextUrl.pathname;
    if(nextUrl.search){
      callbackUrl+=nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)"
  ],
};