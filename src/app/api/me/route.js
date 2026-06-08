import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json({ message: "التوكن غير صالح" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 401 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/me ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
