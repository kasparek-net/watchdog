import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";

const PUBLIC_PREFIXES = ["/sign-in", "/api/auth/", "/api/cron/"];

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p))) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!verifySessionValue(cookie)) {
    if (path.startsWith("/api/")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
