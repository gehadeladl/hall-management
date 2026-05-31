import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { hallId, date } = await req.json();

    const bookings = await prisma.booking.findMany({
      where: {
        hallId,
        bookingDate: new Date(date),
      },

      include: {
        createdBy: {
          select: {
            username: true,
          },
        },

        cancellation: {
          include: {
            cancelledBy: {
              select: {
                username: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(bookings);

    return NextResponse.json(booking);
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
