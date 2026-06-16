import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { captureServerEvent } from "@/lib/posthog";

const analyticsSchema = z.object({
  event: z.string().min(1).max(120),
  properties: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  const user = await requireUser();
  const data = analyticsSchema.parse(await request.json());

  await captureServerEvent(user.clerkId, data.event, data.properties);

  return NextResponse.json({ ok: true });
}
