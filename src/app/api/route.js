import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const today = new Date();

    const hallsCount =
      decoded.role === "SUPER_ADMIN"
        ? await prisma.hall.count()
        : await prisma.hallEmployee.count({
            where: {
              userId: decoded.id,
            },
          });

    const bookingsWhere =
      decoded.role === "SUPER_ADMIN"
        ? {}
        : {
            hall: {
              employees: {
                some: {
                  userId: decoded.id,
                },
              },
            },
          };

    const upcomingBookings = await prisma.booking.count({
      where: {
        ...bookingsWhere,
        status: "ACTIVE",
        bookingDate: {
          gte: today,
        },
      },
    });

    const cancelledBookings = await prisma.booking.count({
      where: {
        ...bookingsWhere,
        status: "CANCELLED",
      },
    });

    const deposits = await prisma.booking.aggregate({
      where: {
        ...bookingsWhere,
        status: "ACTIVE",
      },
      _sum: {
        depositAmount: true,
      },
    });

    const latestBookings = await prisma.booking.findMany({
      where: bookingsWhere,
      include: {
        hall: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const upcomingEvents = await prisma.booking.findMany({
      where: {
        ...bookingsWhere,
        status: "ACTIVE",
        bookingDate: {
          gte: today,
        },
      },
      include: {
        hall: true,
      },
      orderBy: {
        bookingDate: "asc",
      },
      take: 5,
    });

    return NextResponse.json({
      hallsCount,
      upcomingBookings,
      cancelledBookings,
      totalDeposits: deposits._sum.depositAmount || 0,
      latestBookings,
      upcomingEvents,
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
