import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "غير مصرح لك",
        },
        {
          status: 403,
        },
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          message: "غير مصرح لك",
        },
        {
          status: 403,
        },
      );
    }

    const requests = await prisma.bookingRequest.findMany({
      where: {
        status: "PENDING",
      },

      include: {
        hall: true,

        createdBy: {
          select: {
            username: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(requests);
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
