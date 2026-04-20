import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ExtractResult =
  | { ok: true; value: string; hash: string }
  | { ok: false; error: string };

const MAX_BYTES = 5 * 1024 * 1024;

export async function fetchHtml(url: string, timeoutMs = 15000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "PagedogBot/1.0 (+https://github.com/kasparek-net/pagedog)",
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
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const decoder = new TextDecoder();
  let html = "";
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      reader.cancel().catch(() => {});
      throw new Error("Response too large (limit 5 MB)");
    }
    html += decoder.decode(value, { stream: true });
  }
  html += decoder.decode();
  return html;
}

export function isPrivateIp(ip: string): boolean {
  if (!isIP(ip)) return true;
  if (isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] >= 224) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice(7);
    return isPrivateIp(v4);
  }
  return false;
}

export async function assertPublicHost(hostname: string): Promise<void> {
  if (!hostname) throw new Error("Empty hostname");
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Private IP not allowed");
    return;
  }
  if (/^localhost$/i.test(hostname) || hostname.endsWith(".localhost")) {
    throw new Error("Local hostname not allowed");
  }
  const results = await lookup(hostname, { all: true });
  for (const r of results) {
    if (isPrivateIp(r.address)) throw new Error("Resolves to private IP");
  }
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
