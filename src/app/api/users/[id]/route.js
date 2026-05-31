export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import bcrypt from "bcrypt";

// ===============================
// 🗑️ حذف مستخدم
// ===============================

export async function DELETE(req, { params }) {
  try {
    const userId = params?.id;

    if (!userId) {
      return NextResponse.json({ message: "معرف غير صالح" }, { status: 400 });
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 },
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "لا يمكن حذف السوبر أدمن" },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "تم الحذف بنجاح",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}

// ===============================
// ✏️ تعديل مستخدم
// ===============================

export async function PUT(req, { params }) {
  try {
    const userId = params?.id;

    if (!userId) {
      return NextResponse.json({ message: "معرف غير صالح" }, { status: 400 });
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const { username, password } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 },
      );
    }

    if (existingUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "لا يمكن تعديل السوبر أدمن" },
        { status: 400 },
      );
    }

    let updatedData = { username };

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData.password = hashedPassword;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updatedData,
    });

    return NextResponse.json({
      message: "تم التعديل بنجاح",
    });
  } catch (error) {
    console.error("PUT ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
