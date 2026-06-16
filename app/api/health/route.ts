import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      service: "kiosq-study-cafe-os",
      database: "online",
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "kiosq-study-cafe-os",
        database: "offline",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
