import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const assignments = await prisma.hallEmployee.findMany({
      where: {
        userId: params.id,
      },

      select: {
        hallId: true,
      },
    });

    return NextResponse.json(assignments.map((item) => item.hallId));
  } catch {
    return NextResponse.json(
      {
        message: "حدث خطأ",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req, { params }) {
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

    const { hallIds } = await req.json();

    await prisma.hallEmployee.deleteMany({
      where: {
        userId: params.id,
      },
    });

    if (hallIds && hallIds.length > 0) {
      await prisma.hallEmployee.createMany({
        data: hallIds.map((hallId) => ({
          hallId,
          userId: params.id,
        })),
      });
    }

    return NextResponse.json({
      message: "تم التعيين بنجاح",
    });
  } catch {
    return NextResponse.json(
      {
        message: "حدث خطأ",
      },
      {
        status: 500,
      },
    );
  }
}
