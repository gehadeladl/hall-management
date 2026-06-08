import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

// ==============================
// تعديل قاعة
// ==============================

export async function PUT(req, { params }) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const { name } = await req.json();

    await prisma.hall.update({
      where: {
        id: params.id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json({
      message: "تم التعديل بنجاح",
    });
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}

// ==============================
// حذف قاعة
// ==============================

export async function DELETE(req, { params }) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    await prisma.hall.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      message: "تم حذف القاعة بنجاح",
    });
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}

// ==============================
// جلب قاعة واحدة
// ==============================

export async function GET(req, { params }) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    let hall = null;

    // السوبر أدمن يشوف أي قاعة
    if (decoded.role === "SUPER_ADMIN") {
      hall = await prisma.hall.findUnique({
        where: {
          id: params.id,
        },
        include: {
          bookings: {
            where: {
              status: "ACTIVE",
            },
            include: {
              cancelRequests: {
                where: {
                  status: "PENDING",
                },
              },
            },
          },

          bookingRequests: {
            where: {
              status: "PENDING",
            },
          },
        },
      });
    } else {
      // الموظف يشوف القاعات المعين عليها فقط
      hall = await prisma.hall.findFirst({
        where: {
          id: params.id,
          employees: {
            some: {
              userId: decoded.id,
            },
          },
        },
        include: {
          bookings: {
            where: {
              status: "ACTIVE",
            },
            include: {
              cancelRequests: {
                where: {
                  status: "PENDING",
                },
              },
            },
          },

          bookingRequests: {
            where: {
              status: "PENDING",
            },
          },
        },
      });
    }

    if (!hall) {
      return NextResponse.json(
        { message: "القاعة غير موجودة" },
        { status: 404 },
      );
    }

    return NextResponse.json(hall);
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
