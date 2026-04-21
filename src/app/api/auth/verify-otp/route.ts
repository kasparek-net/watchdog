import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  OTP_MAX_ATTEMPTS,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSessionValue,
  hashOtp,
  isAllowed,
} from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email().max(200),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = rateLimit("auth:verify-otp", ip, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a moment." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.resetMs / 1000).toString() } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const code = parsed.data.code;

  if (!isAllowed(email)) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  const record = await db.signInCode.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await db.signInCode.deleteMany({ where: { email } });
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 401 },
    );
  }

  const expected = hashOtp(code, email);
  const match =
    expected.length === record.codeHash.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(record.codeHash));

  if (!match) {
    await db.signInCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  await db.signInCode.deleteMany({ where: { email } });

  const value = createSessionValue(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
