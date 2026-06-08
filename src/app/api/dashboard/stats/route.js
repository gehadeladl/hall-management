import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    // ✅ التحقق من الـ role هنا في الباك — مش على الفرونت
    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const [hallsCount, usersCount, bookingRequestsCount, cancelRequestsCount] =
      await Promise.all([
        prisma.hall.count(),
        prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
        prisma.bookingRequest.count({ where: { status: "PENDING" } }),
        prisma.cancelRequest.count({ where: { status: "PENDING" } }),
      ]);

    return NextResponse.json({
      hallsCount,
      usersCount,
      bookingRequestsCount,
      cancelRequestsCount,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
