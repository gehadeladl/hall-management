export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import bcrypt from "bcrypt";

const MIN_PASSWORD_LENGTH = 8;

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
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    // منع السوبر أدمن من حذف نفسه
    if (decoded.id === userId) {
      return NextResponse.json(
        { message: "لا يمكنك حذف حسابك الخاص" },
        { status: 400 },
      );
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

    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch (error) {
    console.error("DELETE /api/users/[id] ERROR:", error);
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
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const body = await req.json();
    const { username, password } = body;

    // ── Validation ──
    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { message: "اسم المستخدم مطلوب" },
        { status: 400 },
      );
    }

    if (
      password &&
      password.trim() !== "" &&
      password.length < MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        {
          message: `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} حروف على الأقل`,
        },
        { status: 400 },
      );
    }

    const sanitizedUsername = username.trim();

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

    // التحقق إن الاسم الجديد مش موجود عند حد تاني
    if (sanitizedUsername !== existingUser.username) {
      const taken = await prisma.user.findUnique({
        where: { username: sanitizedUsername },
      });
      if (taken) {
        return NextResponse.json(
          { message: "اسم المستخدم موجود بالفعل" },
          { status: 400 },
        );
      }
    }

    const updatedData = { username: sanitizedUsername };

    if (password && password.trim() !== "") {
      updatedData.password = await bcrypt.hash(password, 12);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updatedData,
    });

    return NextResponse.json({ message: "تم التعديل بنجاح" });
  } catch (error) {
    console.error("PUT /api/users/[id] ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
