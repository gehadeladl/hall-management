import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function GET(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(null);
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json(null);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  return NextResponse.json(user);
}
