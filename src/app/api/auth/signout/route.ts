import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  const res = NextResponse.redirect(url, 303);
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return res;
}
