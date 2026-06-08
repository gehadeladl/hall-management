import { NextResponse } from "next/server";
import { verifyToken } from "./src/lib/jwt";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // ── صفحة الـ login ──
  if (pathname.startsWith("/login")) {
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── حماية الداشبورد ──
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const verified = verifyToken(token);

    if (!verified) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    // ✅ صفحات الـ SUPER_ADMIN فقط — لو حد تاني كتب الـ URL يتحول للقاعات
    const superAdminPages = [
      "/dashboard/booking-requests",
      "/dashboard/cancel-requests",
      "/dashboard/employees",
      "/dashboard", // ✅ الصفحة الرئيسية كمان SUPER_ADMIN بس
    ];

    const isSuperAdminPage = superAdminPages.some(
      (p) => pathname === p || (p !== "/dashboard" && pathname.startsWith(p)),
    );

    if (isSuperAdminPage && verified.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/halls", request.url));
    }
  }

  // ── حماية الـ API routes ──
  if (pathname.startsWith("/api/")) {
    const publicApiRoutes = ["/api/login"];
    if (publicApiRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const verified = verifyToken(token);
    if (!verified) {
      return NextResponse.json(
        { message: "التوكن غير صالح أو منتهي" },
        { status: 401 },
      );
    }

    // ✅ API routes خاصة بالـ SUPER_ADMIN فقط
    const superAdminApiRoutes = [
      "/api/users",
      "/api/dashboard",
      "/api/booking-requests",
      "/api/cancel-requests",
    ];

    const isSuperAdminRoute = superAdminApiRoutes.some((r) =>
      pathname.startsWith(r),
    );

    if (isSuperAdminRoute && verified.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
