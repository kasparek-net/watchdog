import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "Pagedog <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendMagicLink(input: { to: string; url: string }) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, magic link:", input.url);
    return;
  }
  const subject = "Sign in to Pagedog";
  const html = `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0a0a;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 8px">Sign in to Pagedog</h2>
  <p style="margin:0 0 16px;color:#525252">Click the button below to sign in. This link expires in 15 minutes.</p>
  <p style="margin:24px 0">
    <a href="${escape(input.url)}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Sign in</a>
  </p>
  <p style="margin:0;color:#737373;font-size:12px">Or paste this URL: ${escape(input.url)}</p>
  <p style="margin:24px 0 0;color:#a3a3a3;font-size:12px">If you didn&apos;t request this, you can ignore the email.</p>
</body></html>`;
  const text = `Sign in to Pagedog\n\n${input.url}\n\nLink expires in 15 minutes.`;
  await resend.emails.send({ from, to: input.to, subject, html, text });
}

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
  const subject = `Change detected: ${input.label}`;
  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0a0a;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 8px">${escape(input.label)}</h2>
  <p style="margin:0 0 16px;color:#525252">A change was detected on the watched page.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#fafafa;border:1px solid #e5e5e5;width:80px;font-size:12px;color:#737373">Was</td><td style="padding:8px;border:1px solid #e5e5e5">${escape(input.oldValue)}</td></tr>
    <tr><td style="padding:8px;background:#fafafa;border:1px solid #e5e5e5;font-size:12px;color:#737373">Now</td><td style="padding:8px;border:1px solid #e5e5e5"><strong>${escape(input.newValue)}</strong></td></tr>
  </table>
  <p style="margin:24px 0 8px"><a href="${escape(input.url)}" style="color:#2563eb">Open page</a></p>
  <p style="margin:0"><a href="${escape(appUrl)}/watches/${input.watchId}" style="color:#737373;font-size:12px">View in Pagedog →</a></p>
</body></html>`;
  const text = `Change detected: ${input.label}\n\nWas: ${input.oldValue}\nNow: ${input.newValue}\n\nPage: ${input.url}\nDetails: ${appUrl}/watches/${input.watchId}\n`;
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
