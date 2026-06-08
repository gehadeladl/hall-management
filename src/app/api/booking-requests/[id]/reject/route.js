import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    await prisma.bookingRequest.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      message: "تم رفض الطلب",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        message: "حدث خطأ في السيرفر",
      },
      {
        status: 500,
      },
    );
  }
}
