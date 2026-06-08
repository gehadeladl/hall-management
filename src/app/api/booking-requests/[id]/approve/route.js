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

    const request = await prisma.bookingRequest.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!request) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        hallId: request.hallId,
        bookingDate: request.bookingDate,
        status: "ACTIVE",
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        {
          message: "اليوم محجوز بالفعل",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.booking.create({
      data: {
        hallId: request.hallId,

        bookingDate: request.bookingDate,

        groomName: request.groomName,

        brideName: request.brideName,

        customerName: request.customerName,

        phone: request.phone,

        depositAmount: request.depositAmount,

        totalAmount: request.totalAmount,

        notes: request.notes,

        createdById: request.createdById,
      },
    });

    await prisma.bookingRequest.delete({
      where: {
        id: request.id,
      },
    });

    return NextResponse.json({
      message: "تم اعتماد الحجز بنجاح",
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
