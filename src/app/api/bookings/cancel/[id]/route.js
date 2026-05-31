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

    if (!decoded) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "الحجز غير موجود" }, { status: 404 });
    }

    const { refundAmount, reason } = await req.json();

    // إنشاء سجل الإلغاء
    await prisma.bookingCancel.create({
      data: {
        bookingId: booking.id,
        refundAmount: Number(refundAmount),
        reason,
        cancelledById: decoded.id,
      },
    });

    // تحديث حالة الحجز
    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      message: "تم إلغاء الحجز بنجاح",
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
