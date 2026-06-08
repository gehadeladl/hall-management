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

    const body = await req.json();

    const {
      hallId,
      bookingDate,
      groomName,
      brideName,
      customerName,
      phone,
      depositAmount,
      totalAmount,
      notes,
    } = body;

    const existingBooking = await prisma.booking.findFirst({
      where: {
        hallId,
        bookingDate: new Date(bookingDate),
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

    const existingRequest = await prisma.bookingRequest.findFirst({
      where: {
        hallId,
        bookingDate: new Date(bookingDate),
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          message: "يوجد طلب حجز بانتظار التأكيد",
        },
        {
          status: 400,
        },
      );
    }

    const request = await prisma.bookingRequest.create({
      data: {
        hallId,
        bookingDate: new Date(bookingDate),

        groomName,
        brideName,

        customerName,
        phone,

        depositAmount: Number(depositAmount),

        totalAmount: Number(totalAmount),

        notes,

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
