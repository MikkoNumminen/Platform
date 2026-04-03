import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ promoted: false, hasSeenPromotion: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, hasSeenPromotion: true },
    });

    if (!user) {
      return NextResponse.json({ promoted: false, hasSeenPromotion: true });
    }

    return NextResponse.json({
      promoted: user.role !== "pending",
      hasSeenPromotion: user.hasSeenPromotion,
    });
  } catch {
    return NextResponse.json({ promoted: false, hasSeenPromotion: true }, { status: 500 });
  }
}
