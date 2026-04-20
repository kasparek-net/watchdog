"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTERVAL_OPTIONS } from "@/lib/format";

export default function WatchControls({
  id,
  isActive,
  label: initialLabel,
  notifyEmail: initialEmail,
  intervalMinutes: initialInterval,
}: {
  id: string;
  isActive: boolean;
  label: string;
  notifyEmail: string;
  intervalMinutes: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState(initialLabel);
  const [email, setEmail] = useState(initialEmail);
  const [interval, setIntervalValue] = useState(initialInterval);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/watches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this watch?")) return;
    setBusy(true);
    try {
      await fetch(`/api/watches/${id}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Label">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => label !== initialLabel && patch({ label })}
            placeholder="Label"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </Field>
        <Field label="Notify email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email !== initialEmail && patch({ notifyEmail: email })}
            placeholder="Email"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </Field>
      </div>
      <Field label="Check every">
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
          {INTERVAL_OPTIONS.map((o) => {
            const active = o.value === interval;
            return (
              <button
                type="button"
                key={o.value}
                disabled={busy}
                onClick={() => {
                  setIntervalValue(o.value);
                  patch({ intervalMinutes: o.value });
                }}
                className={
                  "px-3 py-1.5 text-xs rounded-md transition disabled:opacity-50 " +
                  (active
                    ? "bg-brand text-black font-medium"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800")
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <button
          disabled={busy}
          onClick={() => patch({ isActive: !isActive })}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
        >
          {isActive ? "Pause" : "Resume"}
        </button>
        <button
          disabled={busy}
          onClick={remove}
          className="rounded-md border border-red-300 dark:border-red-900 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
