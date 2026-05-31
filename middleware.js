import { NextResponse } from "next/server";
import { verifyToken } from "./src/lib/jwt";

export function middleware(request) {
  const token = request.cookies.get("token")?.value;

  // لو داخل على login خليه يعدي
  if (request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // حماية الداشبورد
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const verified = verifyToken(token);

    if (!verified) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
