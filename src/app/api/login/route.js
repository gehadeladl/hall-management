import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { message: "البيانات غير مكتملة" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return NextResponse.json({ message: "بيانات غير صحيحة" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return NextResponse.json({ message: "بيانات غير صحيحة" }, { status: 401 });
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    username: user.username,
  });

  const response = NextResponse.json({ message: "تم تسجيل الدخول بنجاح" });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: false,
    path: "/",
  });

  return response;
}
