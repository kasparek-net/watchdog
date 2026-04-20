import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

export type ExtractResult =
  | { ok: true; value: string; hash: string }
  | { ok: false; error: string };

export async function fetchHtml(url: string, timeoutMs = 15000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "WatchdogBot/1.0 (+https://github.com/watchdog) Mozilla/5.0 compatible",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "cs,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("html") && !ct.includes("xml") && !ct.includes("text")) {
    throw new Error(`Unexpected content-type: ${ct}`);
  }
  return await res.text();
}

export function extractFromHtml(html: string, selector: string): ExtractResult {
  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(html);
  } catch {
    return { ok: false, error: "HTML parse error" };
  }
  let el;
  try {
    el = $(selector).first();
  } catch {
    return { ok: false, error: "Invalid CSS selector" };
  }
  if (el.length === 0) return { ok: false, error: "Selector matched no element" };
  const text = el.text().replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, error: "Element is empty" };
  return { ok: true, value: text, hash: sha256(text) };
}

export async function fetchAndExtract(
  url: string,
  selector: string,
): Promise<ExtractResult> {
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fetch failed" };
  }
  return extractFromHtml(html, selector);
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
