import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import bcrypt from "bcrypt";

const MIN_PASSWORD_LENGTH = 8;

export async function PUT(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "البيانات غير مكتملة" },
        { status: 400 },
      );
    }

    // ✅ validation على طول الباسورد الجديد
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          message: `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} حروف على الأقل`,
        },
        { status: 400 },
      );
    }

    // ✅ منع تغيير الباسورد لنفس القيمة
    if (oldPassword === newPassword) {
      return NextResponse.json(
        { message: "كلمة المرور الجديدة لازم تكون مختلفة عن القديمة" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 },
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "كلمة المرور القديمة غير صحيحة" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("PUT /api/change-password ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
