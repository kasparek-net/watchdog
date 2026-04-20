import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "Pagedog <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendChangeNotification(input: {
  to: string;
  label: string;
  url: string;
  oldValue: string;
  newValue: string;
  watchId: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping send");
    return;
  }
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const subject = `Změna na "${input.label}"`;
  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0a0a;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 8px">${escape(input.label)}</h2>
  <p style="margin:0 0 16px;color:#525252">Detekována změna na sledované stránce.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#fafafa;border:1px solid #e5e5e5;width:80px;font-size:12px;color:#737373">Bylo</td><td style="padding:8px;border:1px solid #e5e5e5">${escape(input.oldValue)}</td></tr>
    <tr><td style="padding:8px;background:#fafafa;border:1px solid #e5e5e5;font-size:12px;color:#737373">Nyní</td><td style="padding:8px;border:1px solid #e5e5e5"><strong>${escape(input.newValue)}</strong></td></tr>
  </table>
  <p style="margin:24px 0 8px"><a href="${escape(input.url)}" style="color:#2563eb">Otevřít stránku</a></p>
  <p style="margin:0"><a href="${escape(appUrl)}/watches/${input.watchId}" style="color:#737373;font-size:12px">Detail v aplikaci →</a></p>
</body></html>`;
  const text = `Změna na "${input.label}"\n\nBylo: ${input.oldValue}\nNyní: ${input.newValue}\n\nStránka: ${input.url}\nDetail: ${appUrl}/watches/${input.watchId}\n`;
  await resend.emails.send({
    from,
    to: input.to,
    subject,
    html,
    text,
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
