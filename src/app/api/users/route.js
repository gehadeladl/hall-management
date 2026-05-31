import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
  }

  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "غير مصرح لك" }, { status: 403 });
  }

  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { message: "البيانات غير مكتملة" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "اسم المستخدم موجود بالفعل" },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: "EMPLOYEE",
    },
  });

  return NextResponse.json(newUser);
}
