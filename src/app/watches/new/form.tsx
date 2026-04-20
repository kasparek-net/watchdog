"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "url" | "pick" | "save";

export default function NewWatchForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selector, setSelector] = useState("");
  const [pickedText, setPickedText] = useState("");
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; selector?: string; text?: string };
      if (!data || typeof data !== "object") return;
      if (data.type === "wd:pick" && data.selector) {
        setSelector(data.selector);
        setPickedText(data.text ?? "");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function loadPreview(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPreview(true);
    setPreviewError(null);
    setPreviewHtml(null);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Načtení selhalo" }));
        setPreviewError(j.error ?? `HTTP ${res.status}`);
        return;
      }
      const html = await res.text();
      setPreviewHtml(html);
      setStep("pick");
      try {
        const u = new URL(url);
        if (!label) setLabel(u.hostname);
      } catch {}
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Chyba");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url, selector, notifyEmail: email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Uložení selhalo" }));
        setSubmitError(typeof j.error === "string" ? j.error : "Uložení selhalo");
        return;
      }
      const j = await res.json();
      router.push(`/watches/${j.watch.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={loadPreview} className="space-y-3">
        <Field label="URL">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://shop.cz/produkt"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          />
        </Field>
        <button
          type="submit"
          disabled={loadingPreview || !url}
          className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {loadingPreview ? "Načítám…" : "Načíst stránku"}
        </button>
        {previewError && (
          <div className="text-sm text-red-600">{previewError}</div>
        )}
      </form>

      {step !== "url" && previewHtml && (
        <div className="space-y-3">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Najeď myší na element a klikni. Vybraný element se obtáhne zeleně.
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white">
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              sandbox="allow-scripts"
              className="w-full bg-white"
              style={{ height: "60vh" }}
              title="Náhled stránky"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="CSS selector">
              <input
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder=".stock-status"
                className="w-full font-mono text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none"
              />
            </Field>
            <Field label="Aktuální hodnota">
              <div className="text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 min-h-[38px]">
                {pickedText ? (
                  <span className="font-mono">{pickedText}</span>
                ) : (
                  <span className="text-neutral-400">Klikni na element v náhledu</span>
                )}
              </div>
            </Field>
          </div>
        </div>
      )}

      {step !== "url" && selector && (
        <form onSubmit={save} className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Název hlídání">
              <input
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Naskladnění Foo"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none"
              />
            </Field>
            <Field label="Notifikační email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none"
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Ukládám…" : "Uložit hlídání"}
          </button>
          {submitError && <div className="text-sm text-red-600">{submitError}</div>}
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
