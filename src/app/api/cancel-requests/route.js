import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const { bookingId, refundAmount, reason } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "الحجز غير موجود" }, { status: 404 });
    }

    const existingRequest = await prisma.cancelRequest.findFirst({
      where: {
        bookingId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          message: "يوجد طلب إلغاء بانتظار المراجعة",
        },
        {
          status: 400,
        },
      );
    }

    const request = await prisma.cancelRequest.create({
      data: {
        bookingId,

        refundAmount: Number(refundAmount),

        reason,

        createdById: decoded.id,
      },
    });

    return NextResponse.json(request);
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
