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

    const request = await prisma.cancelRequest.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!request) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    await prisma.bookingCancel.create({
      data: {
        bookingId: request.bookingId,

        refundAmount: request.refundAmount,

        reason: request.reason,

        cancelledById: decoded.id,
      },
    });

    await prisma.booking.update({
      where: {
        id: request.bookingId,
      },
      data: {
        status: "CANCELLED",
      },
    });

    await prisma.cancelRequest.delete({
      where: {
        id: request.id,
      },
    });

    return NextResponse.json({
      message: "تم اعتماد طلب الإلغاء",
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
