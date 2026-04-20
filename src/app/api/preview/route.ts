import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { auth } from "@clerk/nextjs/server";
import { fetchHtml, extractFromHtml } from "@/lib/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HOSTS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isBlocked(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  return PRIVATE_HOSTS.some((re) => re.test(url.hostname));
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (isBlocked(url)) {
    return NextResponse.json({ error: "URL is not allowed" }, { status: 400 });
  }

  const mode = req.nextUrl.searchParams.get("mode");
  const selector = req.nextUrl.searchParams.get("selector");

  let html: string;
  try {
    html = await fetchHtml(url.toString());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 502 },
    );
  }

  if (mode === "test" && selector) {
    const result = extractFromHtml(html, selector);
    return NextResponse.json(result);
  }

  const $ = cheerio.load(html);
  $("script").remove();
  $("noscript").remove();
  $("link[rel='preload'][as='script']").remove();
  $("iframe, object, embed, form").remove();
  $("[onclick], [onmouseover], [onload]").each((_, el) => {
    const attribs = (el as { attribs?: Record<string, string> }).attribs ?? {};
    for (const k of Object.keys(attribs)) {
      if (k.startsWith("on")) $(el).removeAttr(k);
    }
  });

  if ($("base").length === 0) {
    $("head").prepend(`<base href="${url.toString()}">`);
  }
  $("head").append(
    `<style>html,body{margin:0}</style>` +
      `<script src="/picker.js"></script>`,
  );

  const out = $.html();
  return new NextResponse(out, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'self' data: blob: http: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' http: https:; img-src * data: blob:; font-src * data:;",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
