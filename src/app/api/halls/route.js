import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

// ==============================
// جلب جميع القاعات
// ==============================

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json([], { status: 200 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json([], { status: 200 });
    }

    // السوبر أدمن يشوف كل القاعات
    if (decoded.role === "SUPER_ADMIN") {
      const halls = await prisma.hall.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(halls);
    }

    // الموظف يشوف القاعات المعين عليها فقط
    const halls = await prisma.hall.findMany({
      where: {
        employees: {
          some: {
            userId: decoded.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(halls);
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}

// ==============================
// إضافة قاعة
// ==============================

export async function POST(req) {
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

    if (!name?.trim()) {
      return NextResponse.json({ message: "أدخل اسم القاعة" }, { status: 400 });
    }

    const exists = await prisma.hall.findUnique({
      where: {
        name,
      },
    });

    if (exists) {
      return NextResponse.json(
        { message: "اسم القاعة موجود بالفعل" },
        { status: 400 },
      );
    }

    const hall = await prisma.hall.create({
      data: {
        name,
      },
    });

    return NextResponse.json(hall);
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
