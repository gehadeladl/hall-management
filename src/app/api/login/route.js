import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "البيانات غير مكتملة" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    // ✅ نفس الرسالة للـ username والـ password الغلط — منع user enumeration
    if (!user) {
      return NextResponse.json(
        { message: "بيانات غير صحيحة" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "بيانات غير صحيحة" },
        { status: 401 },
      );
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      username: user.username,
    });

    // ✅ بنرجع الـ role عشان الفرونت يعرف يروح فين
    const response = NextResponse.json({
      message: "تم تسجيل الدخول بنجاح",
      role: user.role,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      // ✅ secure على الـ production بس — على dev يشتغل عادي
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
    });

    return response;
  } catch (error) {
    console.error("POST /api/login ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
