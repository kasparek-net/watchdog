import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fetchAndExtract } from "@/lib/extract";

export const runtime = "nodejs";

const CreateSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().url().max(2000),
  selector: z.string().min(1).max(500),
  notifyEmail: z.string().email().max(200),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const watches = await db.watch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { changes: true } } },
  });
  return NextResponse.json({ watches });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { label, url, selector, notifyEmail } = parsed.data;

  const initial = await fetchAndExtract(url, selector);

  const watch = await db.watch.create({
    data: {
      userId,
      label,
      url,
      selector,
      notifyEmail,
      lastValue: initial.ok ? initial.value : null,
      lastHash: initial.ok ? initial.hash : null,
      lastError: initial.ok ? null : initial.error,
      lastCheckedAt: new Date(),
    },
  });
  return NextResponse.json({ watch }, { status: 201 });
}
