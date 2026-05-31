import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const halls = await prisma.hall.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(halls);
}
