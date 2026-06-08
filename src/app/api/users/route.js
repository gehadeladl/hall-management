import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

// ===========================
// ✅ GET — قائمة المستخدمين
// كانت مفتوحة لأي أحد بدون auth — اتأمنت
// ===========================

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}

// ===========================
// ✅ POST — إضافة مستخدم
// ===========================

// الأدوار المسموح بإنشائها — SUPER_ADMIN محمي ومش ممكن يتعمل من الـ API
const ALLOWED_ROLES = ["ADMIN", "EMPLOYEE"];

// الحد الأدنى لطول كلمة المرور
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, role } = body;

    // ── Validation ──
    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { message: "اسم المستخدم مطلوب" },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { message: "كلمة المرور مطلوبة" },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          message: `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} حروف على الأقل`,
        },
        { status: 400 },
      );
    }

    // حماية: منع إنشاء SUPER_ADMIN من الـ API
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { message: "نوع الحساب غير صالح" },
        { status: 400 },
      );
    }

    const sanitizedUsername = username.trim();

    const existingUser = await prisma.user.findUnique({
      where: { username: sanitizedUsername },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "اسم المستخدم موجود بالفعل" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username: sanitizedUsername,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/users ERROR:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر" },
      { status: 500 },
    );
  }
}
