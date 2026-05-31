import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { hallId, date } = await req.json();

    const booking = await prisma.booking.findFirst({
      where: {
        hallId,
        bookingDate: new Date(date),
        status: "ACTIVE",
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
    });

    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ message: "حدث خطأ" }, { status: 500 });
  }
}
